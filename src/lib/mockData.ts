import type { GenerationResult, ProductInput } from "@/types"

const mockImages = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
]

export function generateMockData(input: ProductInput): GenerationResult {
  const { name, brand, category, targetAudience } = input
  
  const copywritings = [
    {
      id: "1",
      title: `${brand} ${name} - 品质之选`,
      content: `${targetAudience ? `${targetAudience}的` : ""}首选${category ? category : "好物"}来了！${brand}推出的${name}，专为追求品质生活的您设计。\n\n✨ 核心卖点：\n- 简约时尚设计，彰显品位\n- 优质材料，耐用可靠\n- 性价比超群，值得拥有\n\n💡 适合${targetAudience || "所有人"}的${name}，让每一天都充满惊喜！`,
    },
    {
      id: "2",
      title: `${name} - 限时特惠`,
      content: `🔥爆款预警！${brand}新品${name}强势来袭！\n\n还在为${targetAudience ? `${targetAudience}挑选` : "挑选礼物"}发愁吗？这款${name}绝对让您眼前一亮！\n\n🎁 为什么要选择我们：\n✓ 品牌保障，品质放心\n✓ 精美包装，送礼首选\n✓ 售后无忧，购物保障\n\n${category ? `[${category}]` : ""}榜单推荐，${targetAudience ? targetAudience : "潮流达人"}都在用的${name}！`,
    },
    {
      id: "3",
      title: `${brand} ${name} - 生活美学`,
      content: `把平凡的日子过成诗，从拥有${name}开始。\n\n作为${brand}的诚意之作，${name}不仅仅是一件${category || "商品"}，更是对生活品质的追求。\n\n🌟 产品特色：\n• 精心打磨的每一个细节\n• 专为${targetAudience || "现代人"}打造的贴心设计\n• 让生活更有仪式感\n\n选择${brand}，选择一种更美好的生活方式。`,
    },
  ]

  const images = mockImages.slice(0, 2).map((url, index) => ({
    id: String(index + 1),
    url,
    description: `${name} 场景展示图 ${index + 1}`,
  }))

  return {
    copywritings,
    images,
  }
}

export async function simulateGeneration(
  input: ProductInput
): Promise<GenerationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockData(input))
    }, 2000)
  })
}
