import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { Trash, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { QuotationCategory, QuotationItem } from "@/services/quotations";
import { Product } from "@/services/products";
import ProductItemForm from "./ProductItemForm";
import { formatCurrency, roundUp } from "@/utils/number-format";
import { useEffect, useState } from "react";

interface CategoryFormProps {
  category: QuotationCategory;
  categoryIndex: number;
  products: Product[];
  onUpdateCategoryName: (index: number, name: string) => void;
  onRemoveCategory: (index: number) => void;
  onAddItem: (categoryIndex: number) => void;
  onRemoveItem: (categoryIndex: number, itemIndex: number) => void;
  onUpdateItem: (
    categoryIndex: number,
    itemIndex: number,
    field: keyof QuotationItem,
    value: any
  ) => void;
  onAddNewProduct: (product: Product) => void;
}

export default function CategoryForm({
  category,
  categoryIndex,
  products,
  onUpdateCategoryName,
  onRemoveCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onAddNewProduct,
}: CategoryFormProps) {
  // Estado para controlar la expansión/colapso de la categoría en móvil
  const [isExpanded, setIsExpanded] = useState(true);

  // Estado local para seguimiento de productos
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  // Actualizamos los productos locales cuando cambia la prop products
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Función para manejar la adición de nuevos productos
  const handleAddNewProduct = (product: Product) => {
    // Agregar el producto a la lista global
    onAddNewProduct(product);

    // También actualizar nuestra lista local para evitar problemas de sincronización
    setLocalProducts((prevProducts) => {
      // Comprobar si el producto ya existe para evitar duplicados
      const exists = prevProducts.some((p) => p.id === product.id);
      if (exists) {
        return prevProducts;
      }
      return [...prevProducts, product];
    });
  };

  // Calcular el total de la categoría
  const calculateCategoryTotal = (): number => {
    return roundUp(
      category.items.reduce((total, item) => {
        const providerPrice =
          item.price || (item.product ? item.product.price : 0);

        // Obtener el markup del producto si existe, o usar 35% por defecto
        const markup = item.product?.markup || 35;
        const finalPrice = Math.ceil(
          providerPrice + (providerPrice * markup) / 100
        );
        return total + finalPrice * item.quantity;
      }, 0)
    );
  };

  // Verificar si hay elementos en la categoría
  const hasItems = category.items.length > 0;

  return (
    <Card className="p-3">
      {/* Cabecera de la categoría con nombre y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center flex-1">
          {/* Botón para expandir/colapsar en móvil */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-1 mr-2 sm:hidden"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>

          <FormField className="flex-grow">
            <FormLabel className="hidden sm:block">
              Nombre de Categoría
            </FormLabel>
            <Input
              value={category.name}
              onChange={(e) =>
                onUpdateCategoryName(categoryIndex, e.target.value)
              }
              placeholder="Ej: Servicios, Productos, etc."
              className="text-sm"
              required
            />
          </FormField>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Total de la categoría siempre visible */}
          <div className="bg-primary/10 px-3 py-1 rounded text-sm">
            <span className="hidden sm:inline">Total de la categoría: </span>
            <span className="font-medium">
              {formatCurrency(calculateCategoryTotal())}
            </span>
          </div>

          {/* Botón para eliminar categoría */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mt-0 sm:mt-6"
            onClick={() => onRemoveCategory(categoryIndex)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido de la categoría (productos) - colapsable en móvil */}
      <div className={`space-y-3 ${isExpanded ? "block" : "hidden sm:block"}`}>
        {/* Lista de productos */}
        {category.items.map((item, itemIndex) => (
          <div
            key={`item-${categoryIndex}-${itemIndex}`}
            className={
              !item.productId || item.productId === 0
                ? "border border-red-300 rounded-md p-2 bg-red-50"
                : ""
            }
          >
            {(!item.productId || item.productId === 0) && (
              <p className="text-red-500 text-xs mb-2">
                ⚠️ Seleccione un producto o elimine esta fila
              </p>
            )}
            <ProductItemForm
              categoryIndex={categoryIndex}
              itemIndex={itemIndex}
              item={item}
              products={localProducts}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              onAddNewProduct={handleAddNewProduct}
            />
          </div>
        ))}

        {/* Mensaje cuando no hay productos */}
        {!hasItems && (
          <div className="text-sm text-muted-foreground text-center py-3">
            No hay productos en esta categoría
          </div>
        )}

        {/* Botón para agregar productos */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddItem(categoryIndex)}
          className="w-full sm:w-auto mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>
    </Card>
  );
}
