export interface BarcodeProduct {
  name: string;
  category?: string;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (!res.ok) return null;
    const data = await res.json() as { status: number; product?: { product_name?: string; categories?: string } };
    if (data.status !== 1 || !data.product?.product_name) return null;
    return {
      name: data.product.product_name,
      category: data.product.categories?.split(',')[0]?.trim(),
    };
  } catch {
    return null;
  }
}
