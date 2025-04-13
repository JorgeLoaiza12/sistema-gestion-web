import { FormField, FormLabel, FormDescription } from "@/components/ui/form";
import { Product } from "@/services/products";
import { EntityForm } from "@/components/ui/entity-form";
import { Edit, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/number-format";
import { Button } from "@/components/ui/button";

interface ProductFormProps {
  currentProduct: Product | null;
  formData: {
    name: string;
    description: string;
    unitPrice: string;
    markup: string;
    imageUrl: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      unitPrice: string;
      markup: string;
      imageUrl: string;
    }>
  >;
  onSave: () => boolean | Promise<boolean>;
  onCancel: () => void;
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function ProductForm({
  currentProduct,
  formData,
  setFormData,
  onSave,
  onCancel,
  onUploadImage,
  fileInputRef,
  isUploading,
  isSubmitting = false,
  error = null,
}: ProductFormProps) {
  // Calcular el precio final en tiempo real
  const unitPrice = parseFloat(formData.unitPrice) || 0;
  const markup = parseFloat(formData.markup) || 0;
  const markupAmount = Math.ceil((unitPrice * markup) / 100);
  const finalPrice = unitPrice + markupAmount;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Muy importante para evitar la propagación
    onSave();
    return false; // Prevenir comportamiento por defecto
  };

  // Input oculto para cargar imágenes
  const fileInput = (
    <input
      type="file"
      ref={fileInputRef}
      onChange={onUploadImage}
      accept="image/*"
      style={{ display: "none" }}
    />
  );

  return (
    <EntityForm
      isOpen={true}
      onClose={(e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        onCancel();
      }}
      onSubmit={handleSubmit}
      title={currentProduct ? "Editar Producto" : "Agregar Producto"}
      isLoading={isSubmitting}
      error={error}
      maxWidth="max-w-md"
      preventClose={true} // Esto previene el cierre accidental
    >
      {fileInput}

      <FormField>
        <FormLabel>Nombre</FormLabel>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </FormField>

      <FormField>
        <FormLabel>Descripción</FormLabel>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel>Precio unitario</FormLabel>
          <Input
            type="number"
            step="1"
            min="0"
            value={formData.unitPrice}
            onChange={(e) =>
              setFormData({ ...formData, unitPrice: e.target.value })
            }
            required
          />
          <FormDescription>Precio base/proveedor</FormDescription>
        </FormField>

        <FormField>
          <FormLabel>Ganancia (%)</FormLabel>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.markup}
            onChange={(e) =>
              setFormData({ ...formData, markup: e.target.value })
            }
            required
          />
          <FormDescription>Porcentaje sobre el precio unitario</FormDescription>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel>Ganancia ($)</FormLabel>
          <Input type="text" value={formatCurrency(markupAmount)} disabled />
          <FormDescription>Monto de ganancia</FormDescription>
        </FormField>

        <FormField>
          <FormLabel>Precio final</FormLabel>
          <Input type="text" value={formatCurrency(finalPrice)} disabled />
          <FormDescription>Precio de venta</FormDescription>
        </FormField>
      </div>

      <FormField>
        <FormLabel>Imagen</FormLabel>
        <div className="flex flex-col gap-4">
          {formData.imageUrl && (
            <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
              <img
                src={formData.imageUrl}
                alt="Vista previa del producto"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              "Subiendo..."
            ) : formData.imageUrl ? (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Cambiar imagen
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir imagen
              </>
            )}
          </Button>
        </div>
      </FormField>
    </EntityForm>
  );
}
