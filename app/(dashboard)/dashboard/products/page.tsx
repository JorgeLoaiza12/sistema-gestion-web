// app/(dashboard)/dashboard/products/page.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash,
  Package,
  DollarSign,
  Boxes,
  Tags,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  sku: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Producto Premium",
      description: "Descripción detallada del producto premium",
      category: "Premium",
      price: 199.99,
      stock: 50,
      status: "active",
      sku: "PRO-001",
      createdAt: "2024-02-20",
    },
    {
      id: "2",
      name: "Producto Básico",
      description: "Descripción del producto básico",
      category: "Básico",
      price: 49.99,
      stock: 100,
      status: "active",
      sku: "BAS-001",
      createdAt: "2024-02-19",
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    sku: "",
    status: "active" as const,
  });

  const categories = ["Premium", "Básico", "Especial", "Limitado"];
  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "active", label: "Activo" },
    { value: "draft", label: "Borrador" },
    { value: "archived", label: "Archivado" },
  ];

  const sortOptions = [
    { value: "newest", label: "Más recientes" },
    { value: "oldest", label: "Más antiguos" },
    { value: "name_asc", label: "Nombre A-Z" },
    { value: "name_desc", label: "Nombre Z-A" },
    { value: "price_asc", label: "Precio menor a mayor" },
    { value: "price_desc", label: "Precio mayor a menor" },
  ];

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) =>
      selectedStatus === "all" ? true : product.status === selectedStatus
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const handleSave = () => {
    const newProduct = {
      id: isEditing || Date.now().toString(),
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      createdAt: new Date().toISOString().split("T")[0],
    };

    if (isEditing) {
      setProducts(products.map((p) => (p.id === isEditing ? newProduct : p)));
    } else {
      setProducts([...products, newProduct]);
    }

    setIsCreating(false);
    setIsEditing(null);
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      sku: "",
      status: "active",
    });
  };

  const columns = [
    {
      id: "product",
      header: "Producto",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-content-subtle">
              SKU: {row.original.sku}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "price",
      header: "Precio",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-content-subtle" />
          <span className="font-medium">{row.original.price.toFixed(2)}</span>
        </div>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-content-subtle" />
          <span>{row.original.stock} unidades</span>
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoría",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Tags className="h-4 w-4 text-content-subtle" />
          <span>{row.original.category}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }: any) => {
        const statusStyles = {
          active: "bg-success/10 text-success",
          draft: "bg-warning/10 text-warning",
          archived: "bg-error/10 text-error",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusStyles[row.original.status]
            }`}
          >
            {row.original.status === "active"
              ? "Activo"
              : row.original.status === "draft"
              ? "Borrador"
              : "Archivado"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(row.original.id);
              setFormData({
                name: row.original.name,
                description: row.original.description,
                category: row.original.category,
                price: row.original.price.toString(),
                stock: row.original.stock.toString(),
                sku: row.original.sku,
                status: row.original.status,
              });
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                confirm("¿Estás seguro de que deseas eliminar este producto?")
              ) {
                setProducts(products.filter((p) => p.id !== row.original.id));
              }
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content-emphasis">Productos</h1>
        <p className="text-content-subtle mt-2">
          Gestiona tu catálogo de productos
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-4">
            <FormInput
              icon={Search}
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <MoreVertical className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        {filteredProducts.length > 0 ? (
          <DataTable columns={columns} data={filteredProducts} />
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-content-subtle mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No se encontraron productos
            </h3>
            <p className="text-content-subtle">
              Intenta ajustar los filtros o crea un nuevo producto
            </p>
          </div>
        )}
      </Card>

      <Dialog
        open={isCreating || Boolean(isEditing)}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setIsEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <FormInput
              label="Nombre del producto"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <FormTextarea
              label="Descripción"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormInput
              label="Precio"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
            <FormInput
              label="Stock"
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
              required
            />
            <FormInput
              label="SKU"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              required
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setIsEditing(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
