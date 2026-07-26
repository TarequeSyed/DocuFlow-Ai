import React, { useState } from "react";
import { Boxes, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { ExtractionSchemaItem } from "../../types";
import { Button } from "../ui/Button";

interface SchemasTabProps {
  schemas?: ExtractionSchemaItem[];
  onCreateSchema: (name: string, description: string, fields: Array<{ name: string; type: string }>) => Promise<void>;
  onDeleteSchema?: (id: string) => Promise<void>;
  isCreating: boolean;
}

export function SchemasTab({ schemas = [], onCreateSchema, onDeleteSchema, isCreating }: SchemasTabProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [fields, setFields] = useState<Array<{ name: string; type: string }>>([
    { name: "invoice_number", type: "string" },
    { name: "vendor", type: "string" },
    { name: "total_amount", type: "number" },
  ]);

  const schemaList = Array.isArray(schemas) ? schemas : [];

  const addField = () => {
    setFields([...fields, { name: "", type: "string" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (index: number, key: "name" | "type", value: string) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateSchema(name, desc, fields.filter((f) => f.name.trim() !== ""));
    setName("");
    setDesc("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      
      {/* Create Schema Form */}
      <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm h-fit">
        <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-indigo-600" /> Create Extraction Schema
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase font-mono">
              Schema Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Legal Contract Schema"
              className="w-full bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl p-3 focus:border-indigo-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase font-mono">
              Description
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description of target metadata fields"
              rows={2}
              className="w-full bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl p-3 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase font-mono">
                Target Properties
              </label>
              <button
                type="button"
                onClick={addField}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer border-none bg-transparent"
              >
                + Add Field
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {fields.map((f, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={f.name}
                    onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                    placeholder="Field name"
                    className="w-full bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl p-2.5 font-mono"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                    className="bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl p-2.5 font-mono"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(idx)}
                      className="text-neutral-400 hover:text-rose-600 text-xs px-1 border-none bg-transparent cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={isCreating} className="w-full">
            Save Schema Target
          </Button>
        </form>
      </div>

      {/* Schema Directory */}
      <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center">
          <Boxes className="w-5 h-5 mr-2 text-indigo-600" /> Active Schema Templates ({schemaList.length})
        </h3>

        {schemaList.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl text-neutral-400 text-xs leading-relaxed">
            No schemas created yet. Use the form on the left to define target parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemaList.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-[#f8f9fa] rounded-xl border border-neutral-200/60 hover:border-neutral-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-neutral-900 text-xs">{s.name}</h4>
                    <div className="flex items-center space-x-1.5">
                      {onDeleteSchema && (
                        <button
                          onClick={() => onDeleteSchema(s.id)}
                          className="p-1 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                          title="Delete schema template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-[10px] text-neutral-500 mb-3 leading-relaxed">{s.description}</p>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-lg font-mono text-[9.5px] text-neutral-700 overflow-x-auto border border-neutral-200/60 mt-auto">
                  <div className="text-neutral-400 font-bold mb-1.5 uppercase tracking-widest text-[8px]">Target Properties:</div>
                  {Object.entries(
                    s.schema_definition?.properties || {}
                  ).map(([key, prop]) => {
                    const typedProp = prop as { type?: string };
                    return (
                      <div key={key} className="flex justify-between py-0.5">
                        <span className="text-neutral-700 font-bold">{key}:</span>
                        <span className="text-indigo-600 font-bold">{typedProp?.type || "string"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
