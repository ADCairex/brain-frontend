import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { ArrowRight, Trash2, Plus } from "lucide-react";
import {
  fetchTransfers,
  createTransfer,
  deleteTransfer,
} from "@finance/api/api";
import { toast } from "sonner";

export default function TransfersModal({ open, onClose, accounts }) {
  const [transfers, setTransfers] = useState(
    /** @type {Array<{id: number, from_account_id: number|null, to_account_id: number|null, amount: number, date: string, description: string|null}>} */ ([])
  );
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [errors, setErrors] = useState(
    /** @type {{from_account_id?: string, to_account_id?: string, amount?: string}} */ ({})
  );

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTransfers();
      setTransfers(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadTransfers();
  }, [open, loadTransfers]);

  const validate = () => {
    const errs = {};
    if (!form.from_account_id)
      errs.from_account_id = "Seleccioná la cuenta origen";
    if (!form.to_account_id)
      errs.to_account_id = "Seleccioná la cuenta destino";
    if (
      form.from_account_id &&
      form.to_account_id &&
      form.from_account_id === form.to_account_id
    )
      errs.to_account_id = "Las cuentas deben ser diferentes";
    if (!form.amount || parseFloat(form.amount) <= 0)
      errs.amount = "Ingresá un monto válido";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await createTransfer({
        ...form,
        from_account_id: parseInt(form.from_account_id),
        to_account_id: parseInt(form.to_account_id),
        amount: parseFloat(form.amount),
      });
      toast.success("Transferencia registrada");
      setForm({
        from_account_id: "",
        to_account_id: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setErrors({});
      setShowForm(false);
      loadTransfers();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta transferencia?")) return;
    try {
      await deleteTransfer(id);
      toast.success("Transferencia eliminada");
      loadTransfers();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const accountName = (id) => accounts.find((a) => a.id === id)?.name ?? id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transferencias</DialogTitle>
        </DialogHeader>

        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva transferencia
          </Button>
        ) : (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Desde</Label>
                <Select
                  value={form.from_account_id}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, from_account_id: v }))
                  }
                >
                  <SelectTrigger
                    className={errors.from_account_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Cuenta origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.from_account_id && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.from_account_id}
                  </p>
                )}
              </div>
              <div>
                <Label>Hacia</Label>
                <Select
                  value={form.to_account_id}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, to_account_id: v }))
                  }
                >
                  <SelectTrigger
                    className={errors.to_account_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Cuenta destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.to_account_id && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.to_account_id}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                )}
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Ej: Pago cuota casa"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setErrors({});
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 mt-2">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Cargando...
            </p>
          )}
          {!loading && transfers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay transferencias registradas
            </p>
          )}
          {transfers.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {accountName(t.from_account_id)}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {accountName(t.to_account_id)}
                </span>
                {t.description && (
                  <span className="text-muted-foreground">
                    · {t.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">
                  ${t.amount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">{t.date}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
