import { BlogImageLightbox } from "../BlogImageLightbox";

type BlogImageProps = {
  src: string;
  fullSrc?: string;
  alt: string;
  caption?: string;
  orientation?: "landscape" | "portrait";
};

export function BlogImage({
  src,
  fullSrc,
  alt,
  caption,
  orientation
}: BlogImageProps) {
  return (
    <BlogImageLightbox
      src={src}
      fullSrc={fullSrc || src}
      alt={alt}
      caption={caption}
      orientation={orientation}
    />
  );
}
