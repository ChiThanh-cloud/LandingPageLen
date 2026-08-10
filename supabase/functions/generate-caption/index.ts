import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const PRODUCT_COLUMNS = 'id,name,category,sub_category,price,weight,status,image_url,description';
const PROMPT_VERSION = 'tiny-facebook-caption-v2';

type CaptionResult = {
  facebook_caption: string;
  main_keyword: string;
  hashtags: string[];
  seo_score_note: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function normalizeCaptionResult(value: unknown): CaptionResult {
  if (!value || typeof value !== 'object') {
    throw new Error('AI không trả về JSON hợp lệ.');
  }

  const record = value as Record<string, unknown>;
  const hashtags = Array.isArray(record.hashtags)
    ? record.hashtags.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  const result = {
    facebook_caption: String(record.facebook || record.facebook_caption || '').trim(),
    main_keyword: String(record.main_keyword || '').trim(),
    hashtags,
    seo_score_note: String(record.seo_score_note || '').trim()
  };

  if (!result.facebook_caption) {
    throw new Error('AI trả về thiếu caption.');
  }

  return result;
}

function extractResponseText(responseBody: Record<string, unknown>) {
  if (typeof responseBody.output_text === 'string') return responseBody.output_text;

  const candidates = Array.isArray(responseBody.candidates) ? responseBody.candidates : [];
  for (const candidate of candidates) {
    const content = (candidate as Record<string, unknown>)?.content as Record<string, unknown> | undefined;
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    for (const part of parts) {
      const text = (part as Record<string, unknown>)?.text;
      if (typeof text === 'string') return text;
    }
  }

  const output = Array.isArray(responseBody.output) ? responseBody.output : [];
  for (const item of output) {
    const content = (item as Record<string, unknown>)?.content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      const text = (part as Record<string, unknown>)?.text;
      if (typeof text === 'string') return text;
    }
  }

  return '';
}

function buildPrompt(product: Record<string, unknown>) {
  const valueOrEmpty = (value: unknown) => value ?? '';

  return [
    'Bạn là người viết content bán hàng Facebook cho shop “Tiệm len nhà Tiny”.',
    '',
    'Hãy viết 1 caption Facebook có khả năng ra đơn cho sản phẩm sau:',
    '',
    `Tên sản phẩm: ${valueOrEmpty(product.name)}`,
    `Danh mục: ${valueOrEmpty(product.category)}`,
    `Loại sản phẩm: ${valueOrEmpty(product.sub_category)}`,
    `Giá: ${valueOrEmpty(product.price)}`,
    `Khối lượng: ${valueOrEmpty(product.weight)}`,
    'Chất liệu: ',
    'Màu sắc: ',
    `Tình trạng: ${valueOrEmpty(product.status)}`,
    `Mô tả: ${valueOrEmpty(product.description)}`,
    '',
    'Yêu cầu caption:',
    '- Dòng đầu phải chứa từ khóa chính và gây chú ý.',
    '- Viết tự nhiên như shop handmade thật, không giống AI.',
    '- Làm rõ sản phẩm này phù hợp với ai.',
    '- Nêu lý do khách nên inbox: tư vấn màu, chọn set, phối màu, chọn mẫu.',
    '- Có giá nếu có dữ liệu giá.',
    '- Không bịa ưu đãi, không bịa tồn kho, không bịa cam kết.',
    '- Không dùng icon quá nhiều.',
    '- Độ dài khoảng 700–1200 ký tự.',
    '- Cuối bài có CTA mạnh.',
    '- Có 5–10 hashtag liên quan đến sản phẩm và shop.',
    '',
    'Trả về JSON:',
    '{',
    '  "facebook_caption": "...",',
    '  "main_keyword": "...",',
    '  "hashtags": ["...", "..."],',
    '  "seo_score_note": "..."',
    '}'
  ].join('\n');
}

async function generateCaptions(product: Record<string, unknown>, geminiKey: string, model: string) {
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': geminiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: buildPrompt(product)
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            facebook_caption: { type: 'string' },
            main_keyword: { type: 'string' },
            hashtags: {
              type: 'array',
              items: { type: 'string' }
            },
            seo_score_note: { type: 'string' }
          },
          required: ['facebook_caption', 'main_keyword', 'hashtags', 'seo_score_note']
        }
      }
    })
  });

  const responseBody = await response.json();
  if (!response.ok) {
    throw new Error(responseBody.error?.message || 'Không gọi được Gemini.');
  }

  const text = extractResponseText(responseBody);
  if (!text) {
    throw new Error('Gemini không trả về nội dung caption.');
  }

  return normalizeCaptionResult(JSON.parse(text));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const geminiKey = getEnv('GEMINI_API_KEY');
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const authHeader = req.headers.get('Authorization') || '';

    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Bạn cần đăng nhập admin.' }, 401);
    }

    const sessionClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await sessionClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: 'Phiên đăng nhập không hợp lệ.' }, 401);
    }

    const { data: isAdmin, error: adminError } = await sessionClient.rpc('is_admin');
    if (adminError || !isAdmin) {
      return jsonResponse({ error: 'Tài khoản không có quyền admin.' }, 403);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const body = await req.json().catch(() => ({}));
    const productId = body.product_id;
    if (!productId) {
      return jsonResponse({ error: 'Thiếu product_id.' }, 400);
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return jsonResponse({ error: productError?.message || 'Không tìm thấy sản phẩm.' }, 404);
    }

    const captions = await generateCaptions(product, geminiKey, model);
    const payload = {
      product_id: product.id,
      ...captions,
      model,
      prompt_version: PROMPT_VERSION
    };

    const { data: savedPost, error: saveError } = await supabase
      .from('content_posts')
      .upsert(payload, { onConflict: 'product_id' })
      .select('id,product_id,facebook_caption,main_keyword,hashtags,seo_score_note,model,prompt_version,created_at,updated_at')
      .single();

    if (saveError) {
      throw new Error(saveError.message);
    }

    return jsonResponse({ content_post: savedPost });
  } catch (err) {
    console.error('generate-caption error:', err);
    const message = err instanceof Error ? err.message : 'Tạo caption thất bại.';
    return jsonResponse({ error: message }, 500);
  }
});
