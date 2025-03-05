import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormLabel } from "@/components/ui/form";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type QuotationCategory,
  type QuotationItem,
  type Quotation,
  createQuotation,
  updateQuotation,
} from "@/services/quotations";
import { getClients, Client } from "@/services/clients";
import { getProducts, Product } from "@/services/products";
import CategoryForm from "./CategoryForm";
import ClientForm from "./ClientForm";

interface QuotationFormProps {
  quotation: Quotation | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function QuotationForm({
  quotation,
  onSave,
  onCancel,
}: QuotationFormProps) {
  const [title, setTitle] = useState(quotation?.title || "");
  const [description, setDescription] = useState(quotation?.description || "");
  const [clientId, setClientId] = useState<string>(
    quotation?.clientId.toString() || ""
  );
  const [validUntil, setValidUntil] = useState(
    quotation?.validUntil
      ? new Date(quotation.validUntil).toISOString().split("T")[0]
      : ""
  );
  const [categories, setCategories] = useState<QuotationCategory[]>(
    quotation?.categories || [{ name: "General", items: [] }]
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);

  // Al montar el componente, cargar los datos necesarios para el formulario
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoading(true);

        const [clientsData, productsData] = await Promise.all([
          getClients(),
          getProducts(),
        ]);

        // Convertir los datos de productos al formato que necesitamos
        const formattedProducts = productsData.map((product) => ({
          id: parseInt(product.id as string),
          name: product.name,
          description: product.description,
          price: product.price,
        }));

        setClients(clientsData);
        setProducts(formattedProducts);
        setError(null);
      } catch (err) {
        console.error("Error loading form data:", err);
        setError("Error al cargar los datos del formulario");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormData();
  }, []);

  const addCategory = () => {
    setCategories([...categories, { name: "", items: [] }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategoryName = (index: number, name: string) => {
    const newCategories = [...categories];
    newCategories[index].name = name;
    setCategories(newCategories);
  };

  const addItem = (categoryIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].items.push({
      productId: 0,
      quantity: 1,
      product: {
        id: 0,
        name: "",
        price: 0,
      },
    });
    setCategories(newCategories);
  };

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].items.splice(itemIndex, 1);
    setCategories(newCategories);
  };

  const updateItem = (
    categoryIndex: number,
    itemIndex: number,
    field: keyof QuotationItem,
    value: any
  ) => {
    const newCategories = [...categories];
    // @ts-ignore: Field assignment is dynamic
    newCategories[categoryIndex].items[itemIndex][field] = value;

    // Si se actualiza el productId, también actualizamos el precio y el objeto product
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        newCategories[categoryIndex].items[itemIndex].price = product.price;
        newCategories[categoryIndex].items[itemIndex].product = product;
      }
    }

    setCategories(newCategories);
  };

  const handleAddNewProduct = (product: Product) => {
    setProducts([...products, product]);
  };

  const handleAddNewClient = (client: Client) => {
    // Asegurarse de que el cliente tenga un ID
    if (!client.id) {
      console.error("Cliente creado sin ID:", client);
      setError("Error al crear el cliente: no se recibió un ID válido");
      return;
    }

    console.log("Cliente creado correctamente:", client);

    // Agregar el cliente a la lista local
    setClients([...clients, client]);

    // Seleccionar el cliente recién creado
    setClientId(client.id.toString());

    // Cerrar el diálogo
    setIsNewClientDialogOpen(false);
  };

  const calculateQuotationTotal = (): number => {
    return categories.reduce((total, category) => {
      return (
        total +
        category.items.reduce((categoryTotal, item) => {
          const providerPrice =
            item.price || (item.product ? item.product.price : 0);
          const finalPrice = providerPrice + providerPrice * 0.35; // Agregar ganancia del 35%
          return categoryTotal + finalPrice * item.quantity;
        }, 0)
      );
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || clientId === "new") {
      setError("Debe seleccionar un cliente");
      return;
    }

    if (
      categories.length === 0 ||
      categories.some((cat) => cat.items.length === 0)
    ) {
      setError("Debe agregar al menos un producto a la cotización");
      return;
    }

    const client = clients.find((c) => c.id?.toString() === clientId);

    if (!client) {
      setError("Cliente no encontrado");
      console.error("Cliente no encontrado con ID:", clientId);
      console.log("Clientes disponibles:", clients);
      return;
    }

    try {
      setIsSaving(true);

      // Asegurarnos de que clientId sea un número válido
      const clientIdNum = parseInt(clientId);
      if (isNaN(clientIdNum)) {
        setError(`ID de cliente inválido: ${clientId}`);
        setIsSaving(false);
        return;
      }

      console.log("Enviando cotización con clientId:", clientIdNum);

      const quotationData: Quotation = {
        id: quotation?.id,
        clientId: clientIdNum,
        title,
        description,
        validUntil: validUntil || undefined,
        categories,
        client: {
          id: clientId,
          name: client.name,
          email: client.email || "",
        },
      };

      if (quotation?.id) {
        // Actualizar cotización existente
        await updateQuotation(quotation.id, quotationData);
      } else {
        // Crear nueva cotización
        await createQuotation(quotationData);
      }

      onSave();
    } catch (err) {
      console.error("Error al guardar la cotización:", err);
      setError("Error al guardar la cotización");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={() => onCancel()}>
        <DialogContent>
          <div className="text-center py-10">
            <p>Cargando datos del formulario...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quotation ? "Editar Cotización" : "Nueva Cotización"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel>Título</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormField>

            <FormField>
              <FormLabel>Cliente</FormLabel>
              <div className="flex space-x-2">
                <Select
                  value={clientId}
                  onValueChange={(value) => {
                    setClientId(value);
                    if (value === "new") {
                      setIsNewClientDialogOpen(true);
                    }
                  }}
                >
                  <SelectTrigger className="flex-grow">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <div className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear nuevo cliente
                      </div>
                    </SelectItem>
                    {clients.map((client) => (
                      <SelectItem
                        key={client.id}
                        value={client.id?.toString() || ""}
                      >
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormField>
          </div>

          <FormField>
            <FormLabel>Descripción</FormLabel>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          <FormField>
            <FormLabel>Válido hasta</FormLabel>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </FormField>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Productos y Servicios</h3>
              <Button type="button" variant="outline" onClick={addCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Categoría
              </Button>
            </div>

            {categories.map((category, categoryIndex) => (
              <CategoryForm
                key={categoryIndex}
                category={category}
                categoryIndex={categoryIndex}
                products={products}
                onUpdateCategoryName={updateCategoryName}
                onRemoveCategory={removeCategory}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
                onAddNewProduct={handleAddNewProduct}
              />
            ))}

            <div className="flex justify-end mt-6">
              <div className="bg-primary/10 px-6 py-3 rounded-lg">
                <span className="text-lg">Total de la cotización: </span>
                <span className="text-lg font-bold">
                  ${calculateQuotationTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {error && <div className="text-red-500 text-center">{error}</div>}

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : quotation
                ? "Guardar Cambios"
                : "Crear Cotización"}
            </Button>
          </DialogFooter>
        </form>

        {/* Diálogo para crear nuevo cliente */}
        <ClientForm
          isOpen={isNewClientDialogOpen || clientId === "new"}
          onClose={() => {
            setIsNewClientDialogOpen(false);
            if (clientId === "new") {
              setClientId("");
            }
          }}
          onClientCreated={handleAddNewClient}
        />
      </DialogContent>
    </Dialog>
  );
}
