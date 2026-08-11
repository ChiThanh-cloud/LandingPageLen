import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PRODUCT_CATEGORY = 'yarn';
const AVAILABLE_STATUS = 'available';

interface GalleryImage {
  display_index: number;
  original_url: string;
  local_image: string;
  cloudinary_public_id: string;
  image_url: string;
}

interface VariantData {
  position: number;
  code: string;
  source_image: string;
  local_image: string;
  cloudinary_public_id: string;
  image_url: string;
}

interface ProductData {
  name: string;
  slug: string;
  source_url: string;
  target_url: string;
  price: number | null;
  description: string;
  main_image: string;
  gallery: GalleryImage[];
  variants: VariantData[];
}

interface RawImageAttributes {
  dataZoomImage: string | null;
  dataImage: string | null;
  dataSrc: string | null;
  dataOriginal: string | null;
  dataLazySrc: string | null;
  dataSrcset: string | null;
  srcset: string | null;
  src: string | null;
}

interface GalleryStats {
  skippedDataUri: number;
  skippedDuplicate: number;
  skippedVariantImage: number;
}

interface ExistingProduct {
  id: number | string;
  slug: string | null;
  name: string | null;
  category: string | null;
  price: number | string | null;
  base_price: number | string | null;
  description: string | null;
  image_url: string | null;
  full_image_url: string | null;
  status: string | null;
}

interface ExistingVariant {
  id: number | string;
  color_code: string | null;
  image_url: string | null;
  full_image_url: string | null;
  status: string | null;
  sort_order: number | null;
}

const SKIPPED_IMAGE_SCHEMES = ['data:', 'blob:', 'javascript:'];

function isSkippedImageScheme(value: string) {
  const normalized = value.trim().toLowerCase();
  return SKIPPED_IMAGE_SCHEMES.some(scheme => normalized.startsWith(scheme));
}

function normalizeImageUrl(rawValue: string | null | undefined, sourcePageUrl: string) {
  const raw = rawValue?.trim();
  if (!raw || isSkippedImageScheme(raw)) return null;

  try {
    if (raw.startsWith('//')) return `https:${raw}`;

    const parsed = raw.startsWith('https://') || raw.startsWith('http://')
      ? new URL(raw)
      : new URL(raw, sourcePageUrl);

    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function removeBizwebThumbnailTransform(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname === 'bizweb.dktcdn.net') {
      parsed.pathname = parsed.pathname.replace(/^\/thumb\/[^/]+\//, '/');
    }
    return parsed.href;
  } catch {
    return value;
  }
}

function parseSrcset(rawSrcset: string) {
  const parts = rawSrcset
    .trim()
    .split(/\s*,\s*(?=(?:https?:|\/\/|\/|data:|blob:|javascript:))/i)
    .map((part, index) => {
      const match = part.trim().match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)(w|x))?$/i);
      const rawUrl = match?.[1]?.trim() || '';
      const amount = match?.[2] ? Number(match[2]) : index + 1;
      const unit = match?.[3]?.toLowerCase();
      const score = unit === 'x' ? amount * 1_000_000 : amount;
      return { rawUrl, score };
    })
    .filter(candidate => candidate.rawUrl);

  return parts.sort((a, b) => b.score - a.score);
}

function rawImageValues(image: RawImageAttributes) {
  return [
    image.dataZoomImage,
    image.dataImage,
    image.dataSrc,
    image.dataOriginal,
    image.dataLazySrc,
    image.dataSrcset,
    image.srcset,
    image.src,
  ];
}

function countDataUriCandidates(image: RawImageAttributes) {
  let count = 0;
  for (const rawValue of rawImageValues(image)) {
    if (!rawValue) continue;
    if (rawValue.trim().toLowerCase().startsWith('data:')) {
      count += 1;
      continue;
    }
    if (rawValue === image.dataSrcset || rawValue === image.srcset) {
      count += parseSrcset(rawValue)
        .filter(candidate => candidate.rawUrl.toLowerCase().startsWith('data:'))
        .length;
    }
  }
  return count;
}

function selectImageUrl(image: RawImageAttributes | null, sourcePageUrl: string) {
  if (!image) return null;

  const directCandidates = [
    image.dataZoomImage,
    image.dataImage,
    image.dataSrc,
    image.dataOriginal,
    image.dataLazySrc,
  ];
  for (const rawValue of directCandidates) {
    const normalized = normalizeImageUrl(rawValue, sourcePageUrl);
    if (normalized) return removeBizwebThumbnailTransform(normalized);
  }

  for (const rawSrcset of [image.dataSrcset, image.srcset]) {
    if (!rawSrcset) continue;
    for (const candidate of parseSrcset(rawSrcset)) {
      const normalized = normalizeImageUrl(candidate.rawUrl, sourcePageUrl);
      if (normalized) return removeBizwebThumbnailTransform(normalized);
    }
  }

  const normalizedSrc = normalizeImageUrl(image.src, sourcePageUrl);
  return normalizedSrc ? removeBizwebThumbnailTransform(normalizedSrc) : null;
}

function isReusableLocalImage(filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile() || stats.size < 12) return false;

    const header = fs.readFileSync(filePath).subarray(0, 16);
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isGif = header.subarray(0, 6).toString('ascii') === 'GIF87a'
      || header.subarray(0, 6).toString('ascii') === 'GIF89a';
    const isWebp = header.subarray(0, 4).toString('ascii') === 'RIFF'
      && header.subarray(8, 12).toString('ascii') === 'WEBP';
    const isAvif = header.subarray(4, 12).toString('ascii').includes('ftypavif');

    return isJpeg || isPng || isGif || isWebp || isAvif;
  } catch {
    return false;
  }
}

function normalizePlainText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/[\t\f\v ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isCloudinaryUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

function failImport(message: string): never {
  throw new Error(`IMPORT VALIDATION FAILED: ${message}`);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function storedPositivePrice(value: number | string | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (!value) return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseGalleryIndices(rawValue: string) {
  const indices = new Set<number>();
  for (const token of rawValue.split(',').map(value => value.trim()).filter(Boolean)) {
    if (!/^\d+$/.test(token) || Number(token) < 1) {
      throw new Error(`Invalid gallery index "${token}". Use 1-based values such as --exclude-gallery-index="2,3".`);
    }
    indices.add(Number(token));
  }
  return indices;
}

async function triggerCatalogRevalidation(slug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const secret = process.env.CATALOG_REVALIDATE_SECRET?.trim();
  if (!appUrl || !secret) {
    failImport('NEXT_PUBLIC_APP_URL and CATALOG_REVALIDATE_SECRET are required for protected storefront revalidation.');
  }

  const endpoint = new URL('/api/admin/revalidate-catalog', appUrl);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ slug }),
  });
  if (!response.ok) {
    failImport(`Protected storefront revalidation failed with HTTP ${response.status}.`);
  }
}

function validateScrapedProduct(input: {
  slug: string;
  name: string;
  price: number | null;
  variants: VariantData[];
  updateGalleryOnly: boolean;
}) {
  if (!input.slug.trim()) failImport('Missing product slug.');
  if (input.updateGalleryOnly) return;
  if (!input.name.trim()) failImport('Missing product name.');
  if (PRODUCT_CATEGORY !== 'yarn') failImport('Product category must be yarn.');
  if (input.price === null || !Number.isFinite(input.price) || input.price <= 0) {
    failImport('Scraped product price must be a positive number.');
  }
  if (input.variants.length === 0) failImport('No product variants were scraped.');

  const codes = new Set<string>();
  for (const variant of input.variants) {
    if (!variant.code.trim()) failImport(`Variant at DOM position ${variant.position} has no color code.`);
    if (codes.has(variant.code)) failImport(`Duplicate scraped color code: ${variant.code}.`);
    if (!isHttpUrl(variant.source_image)) {
      failImport(`Variant ${variant.code} has no valid source image URL.`);
    }
    codes.add(variant.code);
  }
}

async function scrapeProduct(
  url: string,
  dryRun: boolean,
  download: boolean,
  isImport: boolean,
  excludeGalleryIndices: Set<number>,
  updateGalleryOnly: boolean,
  syncPrice: boolean,
) {
  console.log(`Starting scrape for: ${url}`);
  if (updateGalleryOnly) {
    console.log(`Mode: UPDATE GALLERY ONLY`);
  }
  if (syncPrice) {
    console.log(`Price sync: ENABLED`);
  }
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.product-title, h1.title-product', { timeout: 10000 }).catch(() => {});
    
    const nameSelector = '.product-title h1, h1.title-product';
    const priceSelector = '.special-price .price, .product-price, .price';
    const descSelector = '.product-summary, .product-description, #content';
    const variantSelector = '.swatch-element';
    
    // Extract Name
    const name = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent?.trim() || '' : '';
    }, nameSelector);

    if (!name) {
      throw new Error(`Failed to extract product name using selector: ${nameSelector}`);
    }
    
    const slug = url.split('/').filter(Boolean).pop()?.split('?')[0] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Extract Price
    const priceRaw = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent?.trim() || '' : '';
    }, priceSelector);
    
    const price = priceRaw ? parseInt(priceRaw.replace(/[^\d]/g, ''), 10) : null;
    
    // Extract Description (optional)
    const descriptionRaw = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return '';
      return el instanceof HTMLElement ? el.innerText : el.textContent || '';
    }, descSelector);
    const description = normalizePlainText(descriptionRaw);

    console.log(`\nProduct: ${name}`);
    console.log(`Slug: ${slug}`);
    console.log(`Price: ${price} (raw: ${priceRaw})`);
    
    // Extract Variants
    const variants: VariantData[] = [];
    let position = 1;
    
    if (!updateGalleryOnly) {
      const variantsRaw = await page.evaluate((sel) => {
        const elements = Array.from(document.querySelectorAll(sel));

        return elements.map((el, index) => {
          const input = el.querySelector('input') as HTMLInputElement;
          const label = el.querySelector('label');
          
          let code = '';
          if (input && input.value) {
            code = input.value.trim();
          } else if (label) {
            code = label.textContent?.trim() || '';
          } else {
            code = el.textContent?.trim() || '';
          }
          
          code = code.replace(/\n/g, '').trim();
          
          const img = el.querySelector('img');
          const image = img ? {
            dataZoomImage: img.getAttribute('data-zoom-image'),
            dataImage: img.getAttribute('data-image'),
            dataSrc: img.getAttribute('data-src'),
            dataOriginal: img.getAttribute('data-original'),
            dataLazySrc: img.getAttribute('data-lazy-src'),
            dataSrcset: img.getAttribute('data-srcset'),
            srcset: img.getAttribute('srcset'),
            src: img.getAttribute('src'),
          } : null;

          const backgroundMatch = label?.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
          const fallbackImageUrl = backgroundMatch?.[1]
            || label?.getAttribute('data-bimg')
            || input?.getAttribute('data-bimg')
            || '';
          
          return { code, elementIndex: index, image, fallbackImageUrl };
        });
      }, variantSelector);

      if (variantsRaw.length === 0) {
        console.warn(`No variants found with selector: ${variantSelector}. Proceeding without variants.`);
      }

      const seenCodes = new Set<string>();
      for (const vRaw of variantsRaw) {
        if (!vRaw.code) continue;
        
        if (seenCodes.has(vRaw.code)) {
          console.error(`FAILED: Duplicate color code found: ${vRaw.code}`);
          if (isImport) failImport(`Duplicate scraped color code: ${vRaw.code}.`);
        }
        seenCodes.add(vRaw.code);

        const selectedImage = selectImageUrl(vRaw.image, url)
          || normalizeImageUrl(vRaw.fallbackImageUrl, url);
        const source_image = selectedImage
          ? removeBizwebThumbnailTransform(selectedImage)
          : '';

        if (!source_image || source_image.includes('no-image')) {
          console.error(`FAILED: Missing image for variant: ${vRaw.code}`);
          if (isImport) failImport(`Missing image for variant ${vRaw.code}.`);
        }
        
        const paddedPosition = position.toString().padStart(3, '0');
        const publicId = `lentiny/products/${slug}/${paddedPosition}-${vRaw.code}`;

        variants.push({
          position,
          code: vRaw.code,
          source_image,
          local_image: `data/products/${slug}/images/${paddedPosition}-${vRaw.code}.webp`,
          cloudinary_public_id: publicId,
          image_url: '' 
        });
        position++;
      }

      if (seenCodes.size !== variants.length) {
        console.error(`FAILED: Mismatched counts. Found ${seenCodes.size} codes but created ${variants.length} variants.`);
        if (isImport) failImport('Scraped variant count does not match the unique color-code count.');
      }
      
      const imageCounts = new Map<string, number>();
      for (const v of variants) {
        imageCounts.set(v.source_image, (imageCounts.get(v.source_image) || 0) + 1);
      }
      for (const [img, count] of imageCounts.entries()) {
        if (count > 1) {
          console.warn(`WARNING: Source image ${img} is duplicated across ${count} variants.`);
        }
      }
      console.log(`Found ${variants.length} variants.`);
    }

    // Extract only the primary product gallery. The page also has a thumbnail
    // carousel, variant swatches, recommendations and other Swiper instances.
    const galleryRaw = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll(
        '.product-image-block #lightgallery > .swiper-slide > img'
      )) as HTMLImageElement[];

      return images.map(img => ({
        dataZoomImage: img.getAttribute('data-zoom-image'),
        dataImage: img.getAttribute('data-image'),
        dataSrc: img.getAttribute('data-src'),
        dataOriginal: img.getAttribute('data-original'),
        dataLazySrc: img.getAttribute('data-lazy-src'),
        dataSrcset: img.getAttribute('data-srcset'),
        srcset: img.getAttribute('srcset'),
        src: img.getAttribute('src'),
      }));
    });

    const variantSourceUrls = new Set(variants.map(variant => variant.source_image).filter(Boolean));
    if (updateGalleryOnly) {
      const variantImagesRaw = await page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel)).map(element => {
          const img = element.querySelector('img');
          if (!img) return null;
          return {
            dataZoomImage: img.getAttribute('data-zoom-image'),
            dataImage: img.getAttribute('data-image'),
            dataSrc: img.getAttribute('data-src'),
            dataOriginal: img.getAttribute('data-original'),
            dataLazySrc: img.getAttribute('data-lazy-src'),
            dataSrcset: img.getAttribute('data-srcset'),
            srcset: img.getAttribute('srcset'),
            src: img.getAttribute('src'),
          };
        });
      }, variantSelector);

      for (const rawVariantImage of variantImagesRaw) {
        const variantImageUrl = selectImageUrl(rawVariantImage, url);
        if (variantImageUrl) variantSourceUrls.add(variantImageUrl);
      }
    }
    const seenGalleryUrls = new Set<string>();
    const galleryStats: GalleryStats = {
      skippedDataUri: 0,
      skippedDuplicate: 0,
      skippedVariantImage: 0,
    };
    const cleanGallery: GalleryImage[] = [];
    let galleryDisplayIndex = 0;

    for (let i = 0; i < galleryRaw.length; i++) {
      const rawImage = galleryRaw[i];
      galleryStats.skippedDataUri += countDataUriCandidates(rawImage);
      const source_image = selectImageUrl(rawImage, url);
      if (!source_image) continue;

      if (variantSourceUrls.has(source_image)) {
        galleryStats.skippedVariantImage += 1;
        continue;
      }
      if (seenGalleryUrls.has(source_image)) {
        galleryStats.skippedDuplicate += 1;
        continue;
      }
      seenGalleryUrls.add(source_image);
      galleryDisplayIndex += 1;

      if (excludeGalleryIndices.has(galleryDisplayIndex)) {
        console.log(`Gallery image [${galleryDisplayIndex}] EXCLUDED: ${source_image}`);
        continue;
      }

      const galleryIndex = cleanGallery.length + 1;
      const paddedIndex = galleryIndex.toString().padStart(2, '0');
      cleanGallery.push({
        display_index: galleryDisplayIndex,
        original_url: source_image,
        local_image: `data/products/${slug}/gallery/gallery-${paddedIndex}.webp`,
        cloudinary_public_id: `lentiny/products/${slug}/gallery/gallery-${paddedIndex}`,
        image_url: ''
      });
    }
    const galleryToPersist = cleanGallery.slice(0, 1);

    if (cleanGallery.length > 0) {
      console.log(`Found ${cleanGallery.length} clean gallery images. Main image will be: ${cleanGallery[0].original_url}`);
    } else {
      console.warn(`No valid gallery images found after filtering.`);
    }

    if (isImport) {
      validateScrapedProduct({ slug, name, price, variants, updateGalleryOnly });
    }

    if (dryRun) {
      console.log(`\nPRODUCT GALLERY`);
      cleanGallery.forEach((galleryImage) => {
        console.log(`[${galleryImage.display_index}] ${galleryImage.original_url}`);
      });
      console.log(`Total gallery: ${cleanGallery.length}`);
      console.log(`Skipped data URI: ${galleryStats.skippedDataUri}`);
      console.log(`Skipped duplicate: ${galleryStats.skippedDuplicate}`);
      console.log(`Skipped variant image: ${galleryStats.skippedVariantImage}`);
      console.log(`Gallery images used by runtime: ${galleryToPersist.length}`);

      if (!updateGalleryOnly) {
        console.log(`\nVARIANTS`);
        variants.forEach((variant, index) => {
          console.log(`[${index + 1}] code ${variant.code} -> ${variant.source_image}`);
        });
        console.log(`Total variants: ${variants.length}`);
      }
      return;
    }

    const baseDir = path.join(process.cwd(), `data/products/${slug}`);
    const imagesDir = path.join(baseDir, 'images');
    const galleryDir = path.join(baseDir, 'gallery');
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(galleryDir, { recursive: true });

    // Download Phase
    if (download || isImport) {
      console.log(`\nDownloading gallery images...`);
      for (const g of galleryToPersist) {
        try {
          const imgPath = path.join(process.cwd(), g.local_image);
          if (isReusableLocalImage(imgPath)) {
            console.log(`REUSE: ${g.local_image}`);
            continue;
          }

          const response = await fetch(g.original_url);
          if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
          const buffer = await response.arrayBuffer();
          fs.writeFileSync(imgPath, Buffer.from(buffer));
          console.log(`Downloaded: ${g.local_image}`);
        } catch (error: unknown) {
          const message = errorMessage(error);
          console.error(`FAILED: Could not download gallery image from ${g.original_url}: ${message}`);
          if (isImport) throw new Error(`Gallery image download failed: ${message}`);
        }
      }

      if (!updateGalleryOnly) {
        console.log(`\nDownloading variant images...`);
        for (const v of variants) {
          try {
            const imgPath = path.join(process.cwd(), v.local_image);
            if (isReusableLocalImage(imgPath)) {
              console.log(`REUSE: ${v.local_image}`);
              continue;
            }

            const response = await fetch(v.source_image);
            if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(imgPath, Buffer.from(buffer));
            console.log(`Downloaded: ${v.local_image}`);
          } catch (error: unknown) {
            const message = errorMessage(error);
            console.error(`FAILED: Could not download image for code ${v.code} from ${v.source_image}: ${message}`);
            if (isImport) throw new Error(`Variant ${v.code} image download failed: ${message}`);
          }
        }
      }
    }

    // Import Phase
    if (isImport) {
      if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
        failImport('Supabase credentials are missing.');
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      console.log(`\nValidating database payload...`);

      const { data: existingProduct, error: getProductError } = await supabase
        .from('products')
        .select('id,slug,name,category,price,base_price,description,image_url,full_image_url,status')
        .eq('slug', slug)
        .maybeSingle<ExistingProduct>();

      let productId = existingProduct?.id;
      if (getProductError) {
        throw new Error(`Database error fetching product: ${getProductError.message}`);
      }

      if (updateGalleryOnly && !productId) {
        failImport('--update-gallery-only requires an existing product with the scraped slug.');
      }
      if (existingProduct && existingProduct.category !== PRODUCT_CATEGORY) {
        failImport(`Existing product ${slug} is not in category yarn.`);
      }
      const existingPrice = storedPositivePrice(existingProduct?.price);
      if (existingProduct && !updateGalleryOnly && !syncPrice && existingPrice === null) {
        failImport('Existing products.price is invalid. Use --sync-price only after confirming the scraped price.');
      }

      let existingVariants: ExistingVariant[] = [];

      if (productId) {
        const { data, error } = await supabase
          .from('product_variants')
          .select('id,color_code,image_url,full_image_url,status,sort_order')
          .eq('product_id', productId)
          .order('sort_order', { ascending: true });
        if (error) throw new Error(`Database error fetching existing variants: ${error.message}`);
        existingVariants = data || [];
      }

      const existingCodes = new Map<string, ExistingVariant>();
      for (const variant of existingVariants) {
        const code = variant.color_code?.trim();
        if (!code) {
          if (!updateGalleryOnly) failImport(`Existing variant ${variant.id} has no color_code.`);
          continue;
        }
        if (existingCodes.has(code)) failImport(`Existing product has duplicate color_code ${code}.`);
        existingCodes.set(code, variant);
      }

      if ((galleryToPersist.length > 0 || !updateGalleryOnly) && !process.env.CLOUDINARY_API_SECRET) {
        failImport('CLOUDINARY_API_SECRET is missing.');
      }

      console.log(`\nUploading runtime gallery image to Cloudinary...`);
      for (const g of galleryToPersist) {
        try {
          const imgPath = path.join(process.cwd(), g.local_image);
          const result = await cloudinary.uploader.upload(imgPath, {
            public_id: g.cloudinary_public_id,
            overwrite: true,
            format: 'webp'
          });
          g.image_url = result.secure_url;
          console.log(`Uploaded gallery image: ${g.image_url}`);
        } catch (error: unknown) {
          const message = errorMessage(error);
          console.error(`FAILED: Gallery Cloudinary upload failed: ${message}`);
          throw new Error(`Gallery Cloudinary upload failed: ${message}`);
        }
      }

      if (!updateGalleryOnly) {
        console.log(`\nUploading variants to Cloudinary...`);
        for (const v of variants) {
          try {
            const imgPath = path.join(process.cwd(), v.local_image);
            const result = await cloudinary.uploader.upload(imgPath, {
              public_id: v.cloudinary_public_id,
              overwrite: true,
              format: 'webp'
            });
            v.image_url = result.secure_url;
            console.log(`Uploaded [${v.code}]: ${v.image_url}`);
          } catch (error: unknown) {
            const message = errorMessage(error);
            console.error(`FAILED: [${v.code}] -> Cloudinary upload failed: ${message}`);
            throw new Error(`Variant ${v.code} Cloudinary upload failed: ${message}`);
          }
        }
      }

      const firstExistingVariantImage = existingVariants
        .map(variant => variant.image_url?.trim() || variant.full_image_url?.trim() || '')
        .find(isCloudinaryUrl);
      const firstImportedVariantImage = variants[0]?.image_url?.trim() || '';
      const mainImageUrl = galleryToPersist[0]?.image_url?.trim()
        || (updateGalleryOnly ? firstExistingVariantImage : firstImportedVariantImage)
        || '';

      if (!isCloudinaryUrl(mainImageUrl)) {
        failImport('No valid Cloudinary main image is available from the clean gallery or first variant.');
      }

      if (!updateGalleryOnly) {
        for (const variant of variants) {
          if (!variant.code.trim()) failImport(`Variant at DOM position ${variant.position} has no color code.`);
          if (!isCloudinaryUrl(variant.image_url)) {
            failImport(`Variant ${variant.code} has no valid Cloudinary image after upload.`);
          }
        }
      }

      console.log(`\nUpdating Database...`);
      const updatedAt = new Date().toISOString();
      const expectedPrice = existingProduct && !syncPrice ? existingPrice : price;
      const expectedStatus = existingProduct ? existingProduct.status : AVAILABLE_STATUS;

      if (productId) {
        const productPayload: Record<string, unknown> = updateGalleryOnly
          ? {
              image_url: mainImageUrl,
              full_image_url: mainImageUrl,
              updated_at: updatedAt,
            }
          : {
              image_url: mainImageUrl,
              full_image_url: mainImageUrl,
              base_price: expectedPrice,
              updated_at: updatedAt,
              ...(!existingProduct?.name?.trim() ? { name } : {}),
              ...(!existingProduct?.description?.trim() ? { description } : {}),
              ...(syncPrice ? { price, base_price: price } : {}),
            };
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', productId);
        if (updateError) throw updateError;
        console.log(`Updated existing product: ${slug} (ID: ${productId}) ${mainImageUrl ? 'with new main image' : ''}`);
      } else {
        const productPayload = {
          slug,
          name,
          category: PRODUCT_CATEGORY,
          price,
          base_price: price,
          description,
          image_url: mainImageUrl,
          full_image_url: mainImageUrl,
          status: AVAILABLE_STATUS,
          updated_at: updatedAt,
        };
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select('id')
          .single();
        if (insertError) throw insertError;
        productId = newProduct.id;
        console.log(`Inserted new product: ${slug} (ID: ${productId})`);
      }

      const expectedSortOrders = new Map<string, number | null>();
      const expectedStatuses = new Map<string, string | null>();
      for (const [code, variant] of existingCodes) {
        expectedSortOrders.set(code, variant.sort_order);
        expectedStatuses.set(code, variant.status);
      }

      if (!updateGalleryOnly) {
        for (const v of variants) {
          const variantPayload = {
            product_id: productId,
            name: v.code,
            color_code: v.code,
            image_url: v.image_url,
            full_image_url: v.image_url,
            sort_order: v.position,
            updated_at: updatedAt,
          };

          const existingVariant = existingCodes.get(v.code);
          if (existingVariant) {
            const { error: uvError } = await supabase
              .from('product_variants')
              .update(variantPayload)
              .eq('id', existingVariant.id);
            if (uvError) throw uvError;
            existingCodes.delete(v.code);
          } else {
            const { error: ivError } = await supabase
              .from('product_variants')
              .insert({ ...variantPayload, status: AVAILABLE_STATUS });
            if (ivError) throw ivError;
            expectedStatuses.set(v.code, AVAILABLE_STATUS);
          }
          expectedSortOrders.set(v.code, v.position);
        }
        
        if (existingCodes.size > 0) {
          console.warn(`\nSTALE VARIANTS (exist in DB but not in scraped source):`);
          for (const code of existingCodes.keys()) {
            console.log(`- code ${code} exists locally but not in scraped source`);
          }
        }
      }

      const { data: verifiedProduct, error: verifyProductError } = await supabase
        .from('products')
        .select('id,slug,name,category,price,base_price,description,image_url,full_image_url,status')
        .eq('id', productId)
        .single();
      if (verifyProductError || !verifiedProduct) {
        failImport(`Product read-back failed: ${verifyProductError?.message || 'product not found'}.`);
      }
      if (verifiedProduct.category !== PRODUCT_CATEGORY) failImport('Product read-back category is not yarn.');
      if (!isCloudinaryUrl(verifiedProduct.image_url || '')) failImport('Product read-back image_url is missing or is not Cloudinary.');
      if (!isCloudinaryUrl(verifiedProduct.full_image_url || '')) failImport('Product read-back full_image_url is missing or is not Cloudinary.');
      if (updateGalleryOnly && existingProduct) {
        for (const field of ['slug', 'name', 'category', 'price', 'base_price', 'description', 'status'] as const) {
          if (verifiedProduct[field] !== existingProduct[field]) {
            failImport(`--update-gallery-only changed protected product field ${field}.`);
          }
        }
      } else {
        if (storedPositivePrice(verifiedProduct.price) !== expectedPrice) failImport('Product read-back price is invalid.');
        if (storedPositivePrice(verifiedProduct.base_price) !== expectedPrice) failImport('Product read-back base_price is invalid.');
        if (verifiedProduct.status !== expectedStatus) failImport('Product read-back status was not preserved.');
      }

      const { data: verifiedVariants, error: verifyVariantsError } = await supabase
        .from('product_variants')
        .select('id,color_code,image_url,status,sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      if (verifyVariantsError || !verifiedVariants) {
        failImport(`Variant read-back failed: ${verifyVariantsError?.message || 'variants not found'}.`);
      }

      if (verifiedVariants.length !== expectedStatuses.size) {
        failImport(`Variant read-back count ${verifiedVariants.length} does not match expected count ${expectedStatuses.size}.`);
      }

      const verifiedCodes = new Set<string>();
      for (const variant of verifiedVariants) {
        const code = variant.color_code?.trim();
        if (!code) failImport(`Variant ${variant.id} is missing color_code after read-back.`);
        if (verifiedCodes.has(code)) failImport(`Duplicate color_code ${code} found after read-back.`);
        const hasExpectedImage = updateGalleryOnly
          ? isHttpUrl(variant.image_url || '')
          : isCloudinaryUrl(variant.image_url || '');
        if (!hasExpectedImage) failImport(`Variant ${code} is missing a valid image_url after read-back.`);
        if (variant.sort_order !== expectedSortOrders.get(code)) failImport(`Variant ${code} has incorrect sort_order after read-back.`);
        if (variant.status !== expectedStatuses.get(code)) failImport(`Variant ${code} has incorrect status after read-back.`);
        verifiedCodes.add(code);
      }

      await triggerCatalogRevalidation(slug);
      console.log(`\nImport verified: product ${slug}, ${verifiedVariants.length} variants.`);
      console.log(`Import complete.`);
    }

    const productData: ProductData = {
      name,
      slug,
      source_url: url,
      target_url: `https://lentiny.xyz/len-soi/${slug}`,
      price,
      description,
      main_image: galleryToPersist.length > 0 ? galleryToPersist[0].image_url || galleryToPersist[0].original_url : '',
      gallery: cleanGallery,
      variants
    };

    fs.writeFileSync(path.join(baseDir, 'product.json'), JSON.stringify(productData, null, 2));
    
    if (!updateGalleryOnly) {
      let csvContent = 'position,code,source_image,local_image,cloudinary_public_id,image_url\n';
      for (const v of variants) {
        csvContent += `${v.position},"${v.code}","${v.source_image}","${v.local_image}","${v.cloudinary_public_id}","${v.image_url}"\n`;
      }
      fs.writeFileSync(path.join(baseDir, 'variants.csv'), csvContent);
    }

    console.log(`Output files written to ${baseDir}/`);

  } catch (error: unknown) {
    console.error(`Error during scraping: ${errorMessage(error)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

// CLI args parsing
const args = process.argv.slice(2);
let url = '';
let dryRun = false;
let download = false;
let isImport = false;
let excludeGalleryIndexRaw = '';
let updateGalleryOnly = false;
let syncPrice = false;

for (const arg of args) {
  if (arg === '--dry-run') dryRun = true;
  else if (arg === '--download') download = true;
  else if (arg === '--import') isImport = true;
  else if (arg === '--update-gallery-only') updateGalleryOnly = true;
  else if (arg === '--sync-price') syncPrice = true;
  else if (arg.startsWith('--exclude-gallery-index=')) {
    excludeGalleryIndexRaw = arg.slice('--exclude-gallery-index='.length);
  }
  else if (arg.startsWith('--exclude-gallery=')) {
    console.error('The ambiguous --exclude-gallery option was removed. Use 1-based --exclude-gallery-index="2,3".');
    process.exit(1);
  }
  else if (arg.startsWith('http')) url = arg;
}

if (!url) {
  console.error('Usage: npx tsx scripts/scrape-product.ts <URL> [--dry-run | --download | --import] [--update-gallery-only] [--sync-price] [--exclude-gallery-index="2,3"]');
  process.exit(1);
}

// Validate exclusive flags
if ((dryRun && download) || (dryRun && isImport) || (download && isImport)) {
  console.error('Please specify only ONE of: --dry-run, --download, --import');
  process.exit(1);
}
if (updateGalleryOnly && syncPrice) {
  console.error('--sync-price cannot be combined with --update-gallery-only.');
  process.exit(1);
}

let excludeGalleryIndices: Set<number>;
try {
  excludeGalleryIndices = parseGalleryIndices(excludeGalleryIndexRaw);
} catch (error) {
  console.error(errorMessage(error));
  process.exit(1);
}

// Default to dry-run if none specified
if (!dryRun && !download && !isImport) {
  console.log('No mode specified. Defaulting to --dry-run');
  dryRun = true;
}

scrapeProduct(url, dryRun, download, isImport, excludeGalleryIndices, updateGalleryOnly, syncPrice);
