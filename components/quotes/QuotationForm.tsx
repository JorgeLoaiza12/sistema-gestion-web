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
import { formatCurrency, roundUp } from "@/utils/number-format";

interface QuotationFormProps {
  quotation: Quotation | null;
  onSave: () => void;
  onCancel: () => void;
  statusOptions: Array<{ value: string; label: string; icon: React.ReactNode }>;
}

// Constante para el IVA (19%)
const IVA_RATE = 0.19;

export default function QuotationForm({
  quotation,
  onSave,
  onCancel,
  statusOptions,
}: QuotationFormProps) {
  const [title, setTitle] = useState(quotation?.title || "");
  const [description, setDescription] = useState(quotation?.description || "");
  const [clientId, setClientId] = useState<string>(
    quotation?.clientId?.toString() || ""
  );
  const [status, setStatus] = useState(quotation?.status || "SENT");
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

        setClients(clientsData);
        setProducts(productsData);
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
      price: 0,
      product: null,
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

    // Verificar que las categorías y sus items existen
    if (
      !newCategories[categoryIndex] ||
      !newCategories[categoryIndex].items ||
      !newCategories[categoryIndex].items[itemIndex]
    ) {
      console.error("Índices inválidos:", {
        categoryIndex,
        itemIndex,
        categories: newCategories,
      });
      return;
    }

    // Actualizar el campo específico del item
    // @ts-ignore: Field assignment is dynamic
    newCategories[categoryIndex].items[itemIndex][field] = value;

    // Si se actualiza el productId, también actualizamos el precio y el objeto product
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newCategories[categoryIndex].items[itemIndex].price = product.price;
        newCategories[categoryIndex].items[itemIndex].product = product;
      }
    }

    setCategories(newCategories);
  };

  const handleAddNewProduct = (product: Product) => {
    // Verificar que no exista ya un producto con el mismo ID
    if (!products.some((p) => p.id === product.id)) {
      setProducts((prevProducts) => [...prevProducts, product]);
    }
  };

  const handleAddNewClient = (client: Client) => {
    // Asegurarse de que el cliente tenga un ID
    if (!client.id) {
      console.error("Cliente creado sin ID:", client);
      setError("Error al crear el cliente: no se recibió un ID válido");
      return;
    }

    // Agregar el cliente a la lista local solo si no existe ya
    if (!clients.some((c) => c.id === client.id)) {
      setClients((prevClients) => [...prevClients, client]);
    }

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
          if (!item.product && !item.productId) return categoryTotal;

          const providerPrice =
            item.price || (item.product ? item.product.price : 0);
          const markup = item.product?.markup || 35;
          const finalPrice = Math.ceil(
            providerPrice + (providerPrice * markup) / 100
          );
          return categoryTotal + finalPrice * item.quantity;
        }, 0)
      );
    }, 0);
  };

  const calculateQuotationTotalRevenue = (): number => {
    return categories.reduce((total, category) => {
      return (
        total +
        category.items.reduce((categoryTotal, item) => {
          // Verificamos que exista un producto asociado
          if (!item.product) {
            return categoryTotal;
          }

          // Obtenemos el unitPrice y el markup del producto
          const unitPrice = item.product.unitPrice || 0;
          const markupPercentage = item.product.markup || 0;

          // Calculamos el monto del markup (la ganancia) por unidad
          const markupAmount = Math.round((unitPrice * markupPercentage) / 100);

          // Multiplicamos por la cantidad y sumamos al total de la categoría
          return categoryTotal + markupAmount * item.quantity;
        }, 0)
      );
    }, 0);
  };

  // Calcular el IVA (19%)
  const calculateIVA = (): number => {
    const subtotal = calculateQuotationTotal();
    return Math.round(subtotal * IVA_RATE);
  };

  // Calcular el total con IVA
  const calculateTotalWithIVA = (): number => {
    const subtotal = calculateQuotationTotal();
    const iva = calculateIVA();
    return subtotal + iva;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || clientId === "new") {
      setError("Debe seleccionar un cliente");
      return;
    }

    // Filtrar las categorías que no tienen productos válidos seleccionados
    const validCategories = categories.map((category) => ({
      ...category,
      items: category.items.filter(
        (item) => item.productId && item.productId !== 0
      ),
    }));

    if (
      validCategories.length === 0 ||
      validCategories.some((cat) => cat.items.length === 0)
    ) {
      setError("Debe agregar al menos un producto válido a la cotización");
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

      // Asegurarse de que todos los items tengan sus productos correctamente asociados
      // y filtrar los items con productId = 0 (no seleccionados)
      const processedCategories = categories.map((category) => ({
        ...category,
        items: category.items
          .filter((item) => item.productId && item.productId !== 0) // Filtrar items sin producto seleccionado
          .map((item) => {
            // Si tiene productId pero no tiene el objeto product, intentar buscarlo
            if (
              item.productId &&
              (!item.product || item.product.id !== item.productId)
            ) {
              const product = products.find((p) => p.id === item.productId);
              if (product) {
                return {
                  ...item,
                  product,
                  price: item.price || product.price,
                };
              }
            }
            return item;
          }),
      }));

      const quotationData: Quotation = {
        id: quotation?.id,
        clientId: clientIdNum,
        title,
        description,
        status,
        validUntil: validUntil || undefined,
        categories: processedCategories,
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quotation ? "Editar Cotización" : "Nueva Cotización"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sección de información básica */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {quotation && (
            <FormField>
              <FormLabel>Estado</FormLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {/* Sección de Categorías */}
          <div className="space-y-4">
            {categories.map((category, categoryIndex) => (
              <CategoryForm
                key={`category-${categoryIndex}`}
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

            {/* Encabezado de productos y servicios con botón para agregar categoría */}
            <div className="flex justify-between items-center mt-6">
              <h3 className="text-lg font-medium">Productos y Servicios</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCategory}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agregar Categoría</span>
                <span className="sm:hidden">Categoría</span>
              </Button>
            </div>

            {/* Resumen financiero - Responsive para móvil */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-green-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Total ganancia:</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(
                      calculateQuotationTotalRevenue().toFixed(2)
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-blue-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Subtotal:</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateQuotationTotal().toFixed(2))}
                  </span>
                </div>
              </div>

              <div className="bg-amber-600/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">IVA (19%):</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateIVA().toFixed(2))}
                  </span>
                </div>
              </div>

              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base">Total con IVA:</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatCurrency(calculateTotalWithIVA().toFixed(2))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-center p-2 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          )}

          {/* Botones de acción - Stack en móvil, inline en desktop */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
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
