import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { useCategories } from "@finance/context/CategoryContext";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@finance/api/api";

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoryManager({ open, onClose }) {
  const { categories, refresh } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const resetForm = () => {
    setLabel("");
    setEmoji("");
    setColor("#6366f1");
    setError("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = async () => {
    const name = slugify(label);
    if (!name) {
      setError("Ingresá un nombre válido");
      return;
    }
    if (!emoji.trim()) {
      setError("Elegí un emoji");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createCategory({
        name,
        label: label.trim(),
        emoji: emoji.trim(),
        color,
      });
      await refresh();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!label.trim()) {
      setError("La etiqueta no puede estar vacía");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = { label: label.trim(), emoji: emoji.trim(), color };
      await updateCategory(editingId, data);
      await refresh();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      await refresh();
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setLabel(cat.label);
    setEmoji(cat.emoji);
    setColor(cat.color);
    setError("");
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Categorías
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                {cat.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {cat.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cat.name}
                </p>
              </div>

              {confirmDeleteId === cat.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(cat.id)}
                    aria-label={`Confirmar eliminar ${cat.label}`}
                  >
                    Eliminar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteId(null)}
                    aria-label="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEdit(cat)}
                    aria-label={`Editar ${cat.label}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {cat.is_deletable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600"
                      onClick={() => setConfirmDeleteId(cat.id)}
                      aria-label={`Eliminar ${cat.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-600 pt-4">
            <p className="font-medium text-sm text-slate-700 dark:text-slate-300">
              {editingId ? "Editar categoría" : "Nueva categoría"}
            </p>

            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <div className="space-y-1">
                <Label htmlFor="cat-label" className="text-xs">
                  Nombre
                </Label>
                <Input
                  id="cat-label"
                  placeholder="Ej: Mascotas"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-emoji" className="text-xs">
                  Emoji
                </Label>
                <Input
                  id="cat-emoji"
                  placeholder="🐶"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="h-10 w-16 text-center"
                  maxLength={4}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-color" className="text-xs">
                  Color
                </Label>
                <input
                  id="cat-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            {!editingId && label.trim() && (
              <p className="text-xs text-slate-400">
                Slug: <code>{slugify(label)}</code>
              </p>
            )}

            {error && (
              <p className="text-sm text-rose-500" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={saving}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva categoría
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
