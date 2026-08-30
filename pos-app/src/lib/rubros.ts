// Plantillas por rubro: cada una define etiquetas, atributos extra de producto
// y ajustes por defecto para que el mismo sistema se sienta "hecho a medida"
// para cada tipo de negocio, sin tocar el código.

export type RubroKey = 'retail' | 'boutique' | 'restaurante' | 'farmacia' | 'otro'

export type RubroTemplate = {
  key: RubroKey
  label: string
  icon: string
  productLabel: string       // cómo se llama un "producto" en este rubro
  productLabelPlural: string
  unitDefault: string
  extraAttributes: { key: string; label: string; type: 'text' | 'select'; options?: string[] }[]
  themeColor: string
  taxRateDefault: number
}

export const RUBRO_TEMPLATES: Record<RubroKey, RubroTemplate> = {
  retail: {
    key: 'retail',
    label: 'Retail / Tienda general',
    icon: '🏬',
    productLabel: 'Producto',
    productLabelPlural: 'Productos',
    unitDefault: 'pieza',
    extraAttributes: [
      { key: 'marca', label: 'Marca', type: 'text' },
      { key: 'proveedor', label: 'Proveedor', type: 'text' },
    ],
    themeColor: '#4f46e5',
    taxRateDefault: 16,
  },
  boutique: {
    key: 'boutique',
    label: 'Ropa / Boutique',
    icon: '👗',
    productLabel: 'Prenda',
    productLabelPlural: 'Prendas',
    unitDefault: 'pieza',
    extraAttributes: [
      { key: 'talla', label: 'Talla', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'] },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'temporada', label: 'Temporada/Colección', type: 'text' },
    ],
    themeColor: '#db2777',
    taxRateDefault: 16,
  },
  restaurante: {
    key: 'restaurante',
    label: 'Restaurante / Comida',
    icon: '🍽️',
    productLabel: 'Platillo',
    productLabelPlural: 'Platillos / Menú',
    unitDefault: 'porción',
    extraAttributes: [
      { key: 'categoria_menu', label: 'Sección del menú', type: 'text' },
      { key: 'tiempo_prep', label: 'Tiempo de preparación (min)', type: 'text' },
    ],
    themeColor: '#ea580c',
    taxRateDefault: 16,
  },
  farmacia: {
    key: 'farmacia',
    label: 'Farmacia',
    icon: '💊',
    productLabel: 'Medicamento',
    productLabelPlural: 'Medicamentos',
    unitDefault: 'caja',
    extraAttributes: [
      { key: 'lote', label: 'Lote', type: 'text' },
      { key: 'caducidad', label: 'Fecha de caducidad', type: 'text' },
      { key: 'requiere_receta', label: 'Requiere receta', type: 'select', options: ['Sí', 'No'] },
    ],
    themeColor: '#16a34a',
    taxRateDefault: 0,
  },
  otro: {
    key: 'otro',
    label: 'Otro rubro (personalizado)',
    icon: '🧩',
    productLabel: 'Artículo',
    productLabelPlural: 'Artículos',
    unitDefault: 'pieza',
    extraAttributes: [],
    themeColor: '#0891b2',
    taxRateDefault: 0,
  },
}

export const RUBRO_LIST = Object.values(RUBRO_TEMPLATES)
