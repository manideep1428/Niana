"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  CornerUpLeft,
  Save,
  X,
  Type,
  Image,
  Link,
  Square,
  TextCursor,
  List,
  ToggleLeft,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Helper function to convert RGB to Hex for color picker
function rgbToHex(rgb: string): string {
  if (!rgb || rgb === "transparent" || rgb === "inherit") return "#000000";
  if (rgb.startsWith("#")) return rgb;

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#000000";

  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");

  return `#${r}${g}${b}`;
}

export interface ElementStyles {
  color?: string;
  backgroundColor?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  display?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  opacity?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  [key: string]: any;
}

export interface ElementAttributes {
  id?: string;
  className?: string;
  // Input specific
  type?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  // Image specific
  src?: string;
  alt?: string;
  // Link specific
  href?: string;
  target?: string;
  // Button specific
  // Textarea specific
  rows?: number;
  // Label specific
  for?: string;
  // Icon specific
  iconClass?: string;
  [key: string]: any;
}

export interface SelectedElement {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  styles: ElementStyles;
  attributes?: ElementAttributes;
  path: string[];
}

interface VisualEditorProps {
  selectedElement: SelectedElement | null;
  onUpdateStyle: (property: string, value: string) => void;
  onPreviewStyle?: (property: string, value: string) => void; // Live preview without history
  onUpdateContent: (content: string) => void;
  onUpdateAttribute: (attribute: string, value: string) => void;
  onSelectParent: () => void;
  onSave: () => void;
  onCancel: () => void;
  hasUnsavedChanges?: boolean;
}

// Tag icon mapping
const TAG_ICONS: Record<string, any> = {
  input: TextCursor,
  textarea: TextCursor,
  img: Image,
  a: Link,
  button: Square,
  select: List,
  label: Type,
  div: Square,
  span: Type,
  p: Type,
  h1: Type,
  h2: Type,
  h3: Type,
  h4: Type,
  h5: Type,
  h6: Type,
  i: Type,
};

// Input type options
const INPUT_TYPES = [
  "text",
  "email",
  "password",
  "number",
  "tel",
  "url",
  "search",
  "date",
  "time",
  "datetime-local",
  "checkbox",
  "radio",
  "file",
  "hidden",
];

export function VisualEditor({
  selectedElement,
  onUpdateStyle,
  onPreviewStyle,
  onUpdateContent,
  onUpdateAttribute,
  onSelectParent,
  onSave,
  onCancel,
  hasUnsavedChanges,
}: VisualEditorProps) {
  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
        <p>Select an element in the design to edit its properties.</p>
        <p className="text-xs mt-2 opacity-50">
          Switch to Select mode and click on any element.
        </p>
      </div>
    );
  }

  const { tagName, attributes, styles, textContent } = selectedElement;
  const TagIcon = TAG_ICONS[tagName] || Square;

  // Render tag-specific attribute editors
  const renderAttributeEditor = () => {
    switch (tagName) {
      case "input":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={attributes?.type || "text"}
                onValueChange={(val) => onUpdateAttribute("type", val)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                className="h-8"
                value={attributes?.name || ""}
                placeholder="field_name"
                onChange={(e) => onUpdateAttribute("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Placeholder
              </Label>
              <Input
                className="h-8"
                value={attributes?.placeholder || ""}
                placeholder="Enter placeholder..."
                onChange={(e) =>
                  onUpdateAttribute("placeholder", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                className="h-8"
                value={attributes?.value || ""}
                placeholder="Default value"
                onChange={(e) => onUpdateAttribute("value", e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Disabled</Label>
              <Switch
                checked={attributes?.disabled || false}
                onCheckedChange={(checked) =>
                  onUpdateAttribute("disabled", checked ? "true" : "false")
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Required</Label>
              <Switch
                checked={attributes?.required || false}
                onCheckedChange={(checked) =>
                  onUpdateAttribute("required", checked ? "true" : "false")
                }
              />
            </div>
          </div>
        );

      case "img":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Image Source (URL)
              </Label>
              <Input
                className="h-8"
                value={attributes?.src || ""}
                placeholder="https://..."
                onChange={(e) => onUpdateAttribute("src", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Alt Text</Label>
              <Input
                className="h-8"
                value={attributes?.alt || ""}
                placeholder="Image description"
                onChange={(e) => onUpdateAttribute("alt", e.target.value)}
              />
            </div>
          </div>
        );

      case "a":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Link URL</Label>
              <Input
                className="h-8"
                value={attributes?.href || ""}
                placeholder="https://..."
                onChange={(e) => onUpdateAttribute("href", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Target</Label>
              <Select
                value={attributes?.target || "_self"}
                onValueChange={(val) => onUpdateAttribute("target", val)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Same tab</SelectItem>
                  <SelectItem value="_blank">New tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Button Type
              </Label>
              <Select
                value={attributes?.type || "button"}
                onValueChange={(val) => onUpdateAttribute("type", val)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="button">Button</SelectItem>
                  <SelectItem value="submit">Submit</SelectItem>
                  <SelectItem value="reset">Reset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Disabled</Label>
              <Switch
                checked={attributes?.disabled || false}
                onCheckedChange={(checked) =>
                  onUpdateAttribute("disabled", checked ? "true" : "false")
                }
              />
            </div>
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                className="h-8"
                value={attributes?.name || ""}
                placeholder="field_name"
                onChange={(e) => onUpdateAttribute("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Placeholder
              </Label>
              <Input
                className="h-8"
                value={attributes?.placeholder || ""}
                placeholder="Enter placeholder..."
                onChange={(e) =>
                  onUpdateAttribute("placeholder", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Rows</Label>
              <Input
                className="h-8"
                type="number"
                value={attributes?.rows || 3}
                onChange={(e) => onUpdateAttribute("rows", e.target.value)}
              />
            </div>
          </div>
        );

      case "label":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">For (ID)</Label>
              <Input
                className="h-8"
                value={attributes?.for || ""}
                placeholder="input_id"
                onChange={(e) => onUpdateAttribute("for", e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const hasAttributeEditor = [
    "input",
    "img",
    "a",
    "button",
    "textarea",
    "label",
  ].includes(tagName);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Element Info */}
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Colors</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <Accordion
          type="multiple"
          defaultValue={[
            "attributes",
            "content",
            "colors",
            "spacing",
            "typography",
            "borders",
            "layout",
          ]}
          className="p-4"
        >
          {/* Tag-specific Attributes */}
          {hasAttributeEditor && (
            <AccordionItem value="attributes">
              <AccordionTrigger className="text-sm font-medium py-2">
                Element Attributes
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                {renderAttributeEditor()}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Text Content */}
          {textContent !== undefined && textContent !== "" && (
            <AccordionItem value="content">
              <AccordionTrigger className="text-sm font-medium py-2">
                Text Content
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <Input
                  value={textContent}
                  onChange={(e) => onUpdateContent(e.target.value)}
                  placeholder="Enter text..."
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Colors */}
          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm font-medium py-2">
              Colors
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Text</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded border shadow-sm shrink-0 cursor-pointer p-0.5"
                      value={
                        styles.color?.startsWith("rgb")
                          ? rgbToHex(styles.color)
                          : styles.color || "#000000"
                      }
                      onInput={(e) =>
                        (onPreviewStyle || onUpdateStyle)(
                          "color",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      onChange={(e) => onUpdateStyle("color", e.target.value)}
                    />
                    <Input
                      className="h-8"
                      value={styles.color || ""}
                      placeholder="Inherit"
                      onChange={(e) => onUpdateStyle("color", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Background
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded border shadow-sm shrink-0 cursor-pointer p-0.5"
                      value={
                        styles.backgroundColor?.startsWith("rgb")
                          ? rgbToHex(styles.backgroundColor)
                          : styles.backgroundColor || "#ffffff"
                      }
                      onInput={(e) =>
                        (onPreviewStyle || onUpdateStyle)(
                          "backgroundColor",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      onChange={(e) =>
                        onUpdateStyle("backgroundColor", e.target.value)
                      }
                    />
                    <Input
                      className="h-8"
                      value={styles.backgroundColor || ""}
                      placeholder="Transparent"
                      onChange={(e) =>
                        onUpdateStyle("backgroundColor", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Spacing */}
          <AccordionItem value="spacing">
            <AccordionTrigger className="text-sm font-medium py-2">
              Spacing
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Margin
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    className="h-8 text-center"
                    placeholder="T"
                    value={styles.marginTop || ""}
                    onChange={(e) => onUpdateStyle("marginTop", e.target.value)}
                  />
                  <Input
                    className="h-8 text-center"
                    placeholder="R"
                    value={styles.marginRight || ""}
                    onChange={(e) =>
                      onUpdateStyle("marginRight", e.target.value)
                    }
                  />
                  <Input
                    className="h-8 text-center"
                    placeholder="B"
                    value={styles.marginBottom || ""}
                    onChange={(e) =>
                      onUpdateStyle("marginBottom", e.target.value)
                    }
                  />
                  <Input
                    className="h-8 text-center"
                    placeholder="L"
                    value={styles.marginLeft || ""}
                    onChange={(e) =>
                      onUpdateStyle("marginLeft", e.target.value)
                    }
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Padding
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    className="h-8 text-center"
                    placeholder="T"
                    value={styles.paddingTop || ""}
                    onChange={(e) =>
                      onUpdateStyle("paddingTop", e.target.value)
                    }
                  />
                  <Input
                    className="h-8 text-center"
                    placeholder="R"
                    value={styles.paddingRight || ""}
                    onChange={(e) =>
                      onUpdateStyle("paddingRight", e.target.value)
                    }
                  />
                  <Input
                    className="h-8 text-center"
                    placeholder="B"
                    value={styles.paddingBottom || ""}
                    onChange={(e) =>
                      onUpdateStyle("paddingBottom", e.target.value)
                    }
                  />
                  <Input
                    className="h-8 text-center"
                    placeholder="L"
                    value={styles.paddingLeft || ""}
                    onChange={(e) =>
                      onUpdateStyle("paddingLeft", e.target.value)
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Typography */}
          <AccordionItem value="typography">
            <AccordionTrigger className="text-sm font-medium py-2">
              Typography
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <Input
                    className="h-8"
                    value={styles.fontSize || ""}
                    placeholder="16px"
                    onChange={(e) => onUpdateStyle("fontSize", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Weight
                  </Label>
                  <Select
                    value={styles.fontWeight || "400"}
                    onValueChange={(val) => onUpdateStyle("fontWeight", val)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Thin</SelectItem>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi Bold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                      <SelectItem value="900">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Align</Label>
                <div className="flex rounded-md shadow-sm">
                  {[
                    { val: "left", icon: AlignLeft },
                    { val: "center", icon: AlignCenter },
                    { val: "right", icon: AlignRight },
                    { val: "justify", icon: AlignJustify },
                  ].map(({ val, icon: Icon }) => (
                    <button
                      key={val}
                      onClick={() => onUpdateStyle("textAlign", val)}
                      className={`flex-1 flex items-center justify-center max-w-[40px] h-8 border first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 hover:bg-muted ${
                        styles.textAlign === val
                          ? "bg-primary/10 text-primary z-10 border-primary/20"
                          : "bg-background border-input"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Borders */}
          <AccordionItem value="borders">
            <AccordionTrigger className="text-sm font-medium py-2">
              Borders
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    className="h-8"
                    value={styles.borderWidth || ""}
                    placeholder="0px"
                    onChange={(e) =>
                      onUpdateStyle("borderWidth", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Radius
                  </Label>
                  <Input
                    className="h-8"
                    value={styles.borderRadius || ""}
                    placeholder="0px"
                    onChange={(e) =>
                      onUpdateStyle("borderRadius", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded border shadow-sm shrink-0 cursor-pointer p-0.5"
                      value={
                        styles.borderColor?.startsWith("rgb")
                          ? rgbToHex(styles.borderColor)
                          : styles.borderColor || "#000000"
                      }
                      onInput={(e) =>
                        (onPreviewStyle || onUpdateStyle)(
                          "borderColor",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      onChange={(e) =>
                        onUpdateStyle("borderColor", e.target.value)
                      }
                    />
                    <Input
                      className="h-8"
                      value={styles.borderColor || ""}
                      placeholder="Transparent"
                      onChange={(e) =>
                        onUpdateStyle("borderColor", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Style</Label>
                  <Select
                    value={styles.borderStyle || "none"}
                    onValueChange={(val) => onUpdateStyle("borderStyle", val)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Layout */}
          <AccordionItem value="layout">
            <AccordionTrigger className="text-sm font-medium py-2">
              Layout
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    className="h-8"
                    value={styles.width || ""}
                    placeholder="auto"
                    onChange={(e) => onUpdateStyle("width", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Height
                  </Label>
                  <Input
                    className="h-8"
                    value={styles.height || ""}
                    placeholder="auto"
                    onChange={(e) => onUpdateStyle("height", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Display</Label>
                <Select
                  value={styles.display || "block"}
                  onValueChange={(val) => onUpdateStyle("display", val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                    <SelectItem value="inline-block">Inline Block</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(styles.display === "flex" ||
                styles.display?.includes("flex")) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Direction
                      </Label>
                      <Select
                        value={styles.flexDirection || "row"}
                        onValueChange={(val) =>
                          onUpdateStyle("flexDirection", val)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="row">Row</SelectItem>
                          <SelectItem value="column">Column</SelectItem>
                          <SelectItem value="row-reverse">
                            Row Reverse
                          </SelectItem>
                          <SelectItem value="column-reverse">
                            Column Reverse
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Gap
                      </Label>
                      <Input
                        className="h-8"
                        value={styles.gap || ""}
                        placeholder="0px"
                        onChange={(e) => onUpdateStyle("gap", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Justify
                      </Label>
                      <Select
                        value={styles.justifyContent || "flex-start"}
                        onValueChange={(val) =>
                          onUpdateStyle("justifyContent", val)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flex-start">Start</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="flex-end">End</SelectItem>
                          <SelectItem value="space-between">
                            Space Between
                          </SelectItem>
                          <SelectItem value="space-around">
                            Space Around
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Align
                      </Label>
                      <Select
                        value={styles.alignItems || "stretch"}
                        onValueChange={(val) =>
                          onUpdateStyle("alignItems", val)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flex-start">Start</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="flex-end">End</SelectItem>
                          <SelectItem value="stretch">Stretch</SelectItem>
                          <SelectItem value="baseline">Baseline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Opacity</Label>
                <Input
                  className="h-8"
                  value={styles.opacity || ""}
                  placeholder="1"
                  onChange={(e) => onUpdateStyle("opacity", e.target.value)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
          <Button variant="outline" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
