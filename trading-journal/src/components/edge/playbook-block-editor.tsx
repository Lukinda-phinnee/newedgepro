"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Eye, Heading2, Image as ImageIcon, List, ListChecks, ListOrdered, SeparatorHorizontal, Trash2, Type, X } from "lucide-react";

type BlockOption = {
  label: string;
  description: string;
  icon: typeof Type;
  kind: "heading" | "text" | "bullet" | "numbered" | "checklist" | "image" | "separator";
  keywords: string[];
};

const BLOCK_OPTIONS: BlockOption[] = [
  { label: "Heading", description: "Section heading", icon: Heading2, kind: "heading", keywords: ["header", "title", "h"] },
  { label: "Text", description: "Plain text paragraph", icon: Type, kind: "text", keywords: ["paragraph", "p"] },
  { label: "Bulleted list", description: "List with bullets", icon: List, kind: "bullet", keywords: ["bullet", "unordered"] },
  { label: "Numbered list", description: "List with numbers", icon: ListOrdered, kind: "numbered", keywords: ["number", "ordered"] },
  { label: "Checklist", description: "List with checkboxes", icon: ListChecks, kind: "checklist", keywords: ["todo", "task", "check"] },
  { label: "Image", description: "Add an image to the playbook", icon: ImageIcon, kind: "image", keywords: ["picture", "photo", "media"] },
  { label: "Separator", description: "Add a horizontal divider", icon: SeparatorHorizontal, kind: "separator", keywords: ["divider", "line", "rule"] },
];

interface SlashMatch {
  node: Text;
  start: number;
  end: number;
}

interface PlaybookBlockEditorProps {
  initialContent?: string | null;
  onChange?: (content: string) => void;
}

export function PlaybookBlockEditor({ initialContent, onChange }: PlaybookBlockEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageInsertBlockRef = useRef<HTMLElement | null>(null);
  const slashMatchRef = useRef<SlashMatch | null>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isEmpty, setIsEmpty] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = initialContent || "<p><br></p>";
    setIsEmpty(!editorRef.current.innerText.trim());
  // The editor is keyed by its saved playbook id, so initialize once per document.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchingOptions = BLOCK_OPTIONS.filter((option) => {
    const query = slashQuery.toLowerCase();
    return !query || option.label.toLowerCase().includes(query) || option.keywords.some((keyword) => keyword.includes(query));
  });

  const updateSlashMenu = () => {
    const root = editorRef.current;
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const offset = selection?.anchorOffset;
    if (!root || !selection || !node || typeof offset !== "number" || !root.contains(node) || node.nodeType !== Node.TEXT_NODE) {
      slashMatchRef.current = null;
      setSlashMenuOpen(false);
      return;
    }

    const textNode = node as Text;
    const prefix = textNode.data.slice(0, offset);
    const match = /(?:^|\s)\/([\w-]*)$/.exec(prefix);
    setIsEmpty(!root.innerText.trim());
    if (!match) {
      slashMatchRef.current = null;
      setSlashMenuOpen(false);
      return;
    }

    const slashStart = match.index + (match[0].startsWith(" ") ? 1 : 0);
    slashMatchRef.current = { node: textNode, start: slashStart, end: offset };
    setSlashQuery(match[1]);
    setActiveOption(0);

    const range = document.createRange();
    range.setStart(textNode, offset);
    range.collapse(true);
    const caret = range.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    setMenuPosition({ top: caret.bottom - rootRect.top + 6, left: caret.left - rootRect.left });
    setSlashMenuOpen(true);
  };

  const setCaretAtEnd = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const selectedBlock = (node: Node): HTMLElement | null => {
    const element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
    return element?.closest("p, h1, h2, h3, li, div") ?? null;
  };

  const removeSlashQuery = () => {
    const match = slashMatchRef.current;
    if (match?.node.isConnected) {
      match.node.deleteData(match.start, match.end - match.start);
      const range = document.createRange();
      range.setStart(match.node, match.start);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    slashMatchRef.current = null;
    setSlashMenuOpen(false);
  };

  const applyOption = (option: BlockOption) => {
    const root = editorRef.current;
    const match = slashMatchRef.current;
    if (!root || !match) return;
    const activeNode = match.node.isConnected ? match.node : window.getSelection()?.anchorNode;
    const block = activeNode ? selectedBlock(activeNode) : root.lastElementChild as HTMLElement | null;
    if (option.kind === "image") {
      imageInsertBlockRef.current = block && block !== root ? block : null;
      removeSlashQuery();
      imageInputRef.current?.click();
      return;
    }
    if (option.kind === "separator") {
      removeSlashQuery();
      if (!block || block === root) return;
      const separator = document.createElement("hr");
      separator.className = "playbook-block-separator";
      const paragraph = document.createElement("p");
      paragraph.innerHTML = "<br>";
      if (block.tagName === "LI" && block.parentElement && ["UL", "OL"].includes(block.parentElement.tagName)) {
        const list = block.parentElement;
        const items = Array.from(list.children);
        const itemIndex = items.indexOf(block);
        const beforeList = list.cloneNode(false) as HTMLElement;
        const afterList = list.cloneNode(false) as HTMLElement;
        items.slice(0, itemIndex + 1).forEach((item) => beforeList.appendChild(item));
        items.slice(itemIndex + 1).forEach((item) => afterList.appendChild(item));
        list.replaceWith(...(beforeList.children.length ? [beforeList] : []), separator, paragraph, ...(afterList.children.length ? [afterList] : []));
      } else if (block.textContent?.trim()) {
        block.after(separator, paragraph);
      } else {
        block.replaceWith(separator, paragraph);
      }
      root.focus();
      setCaretAtEnd(paragraph);
      setIsEmpty(false);
      onChange?.(root.innerHTML);
      return;
    }
    removeSlashQuery();
    if (!block || block === root) return;

    if (option.kind === "heading" || option.kind === "text") {
      const tag = option.kind === "heading" ? "h2" : "p";
      const list = block.tagName === "LI" ? block.parentElement : null;
      const replacement = document.createElement(tag);
      replacement.dataset.emptyBlock = option.kind;
      const contentNodes = block.tagName === "LI"
        ? Array.from(block.childNodes).filter((child) => !(child instanceof HTMLInputElement))
        : Array.from(block.childNodes);
      contentNodes.forEach((child) => replacement.appendChild(child));
      if (!replacement.textContent?.trim()) replacement.innerHTML = "<br>";
      if (list) {
        list.parentElement?.insertBefore(replacement, list.nextSibling);
        block.remove();
        if (!list.querySelector("li")) list.remove();
      } else {
        block.replaceWith(replacement);
      }
      root.focus();
      setCaretAtEnd(replacement);
      setIsEmpty(false);
      onChange?.(root.innerHTML);
      return;
    }

    const listTag = option.kind === "numbered" ? "ol" : "ul";
    const taskList = option.kind === "checklist";
    if (block.tagName === "LI") {
      const list = block.parentElement;
      if (!list) return;
      const replacementList = document.createElement(listTag);
      if (taskList) replacementList.dataset.type = "taskList";
      Array.from(list.children).forEach((child) => {
        if (child.tagName !== "LI") return;
        const item = child as HTMLLIElement;
        if (taskList) addChecklistBox(item);
        else removeChecklistBox(item);
        if (item.textContent?.trim()) item.removeAttribute("data-empty-block");
        else item.dataset.emptyBlock = option.kind;
        replacementList.appendChild(item);
      });
      list.replaceWith(replacementList);
      root.focus();
      const editableContent = block.querySelector<HTMLElement>("span[contenteditable='true']");
      setCaretAtEnd(editableContent ?? block);
      setIsEmpty(false);
      onChange?.(root.innerHTML);
      return;
    }

    const list = document.createElement(listTag);
    if (taskList) list.dataset.type = "taskList";
    const item = document.createElement("li");
    item.dataset.emptyBlock = option.kind;
    if (taskList) addChecklistBox(item);
    while (block.firstChild) {
      const destination = taskList ? item.querySelector("span[contenteditable='true']")! : item;
      destination.appendChild(block.firstChild);
    }
    const editableItem = taskList ? item.querySelector<HTMLElement>("span[contenteditable='true']")! : item;
    if (!editableItem.textContent?.trim()) editableItem.innerHTML = "<br>";
    block.replaceWith(list);
    list.appendChild(item);
    root.focus();
    setCaretAtEnd(editableItem);
    setIsEmpty(false);
    onChange?.(root.innerHTML);
  };

  const addImages = async (files: FileList | null) => {
    const root = editorRef.current;
    if (!root || !files?.length) return;
    const target = imageInsertBlockRef.current;
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    let grid = target?.closest<HTMLElement>(".playbook-image-grid") ?? null;
    let anchor: HTMLElement | null = target?.isConnected ? target : null;
    if (anchor?.tagName === "LI") anchor = anchor.parentElement;
    if (anchor && !grid && !anchor.textContent?.trim() && !anchor.querySelector("img")) anchor.remove();
    if (!grid) {
      grid = document.createElement("div");
      grid.className = "playbook-image-grid my-4 grid w-full grid-cols-3 gap-3";
      if (anchor?.isConnected) anchor.parentElement?.insertBefore(grid, anchor.nextSibling);
      else root.appendChild(grid);
    }
    let uploadTile = grid.querySelector<HTMLElement>(".playbook-image-upload");
    if (!uploadTile) {
      uploadTile = createImageUploadTile(() => {
        imageInsertBlockRef.current = grid;
        imageInputRef.current?.click();
      });
      grid.appendChild(uploadTile);
    }
    for (const file of imageFiles) {
      const src = await readImageAsDataUrl(file);
      const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") || "Untitled image";
      const figure = createImageBlock(src, title, root.querySelectorAll(".playbook-image-block").length + 1, setLightboxImage, () => onChange?.(root.innerHTML));
      grid.insertBefore(figure, uploadTile);
    }
    if (imageFiles.length) {
      let paragraph = grid.nextSibling?.nodeName === "P" && !(grid.nextSibling as HTMLElement).textContent?.trim()
        ? grid.nextSibling as HTMLElement
        : null;
      if (!paragraph) {
        paragraph = document.createElement("p");
        paragraph.innerHTML = "<br>";
        grid.parentElement?.insertBefore(paragraph, grid.nextSibling);
      }
      root.focus();
      setCaretAtEnd(paragraph);
      setIsEmpty(false);
      onChange?.(root.innerHTML);
    }
    imageInsertBlockRef.current = null;
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (slashMenuOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (matchingOptions.length) {
          setActiveOption((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + matchingOptions.length) % matchingOptions.length);
        }
        return;
      }
      if (event.key === "Enter" && matchingOptions.length) {
        event.preventDefault();
        applyOption(matchingOptions[activeOption] ?? matchingOptions[0]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        slashMatchRef.current = null;
        setSlashMenuOpen(false);
        return;
      }
    }

    if (event.key === "Tab") {
      const selection = window.getSelection();
      const listItem = selection?.anchorNode && selectedBlock(selection.anchorNode);
      if (listItem?.tagName !== "LI") return;
      const parentList = listItem.parentElement;
      if (!parentList) return;
      if (!event.shiftKey) {
        const previousItem = listItem.previousElementSibling as HTMLLIElement | null;
        if (!previousItem) return;
        let nestedList = Array.from(previousItem.children).find((child) => child.tagName === parentList.tagName) as HTMLElement | undefined;
        if (!nestedList) {
          nestedList = document.createElement(parentList.tagName.toLowerCase());
          if ((parentList as HTMLElement).dataset.type) nestedList.dataset.type = (parentList as HTMLElement).dataset.type!;
          previousItem.appendChild(nestedList);
        }
        nestedList.appendChild(listItem);
      } else {
        const parentItem = parentList.parentElement?.closest("li");
        if (!parentItem) return;
        parentItem.parentElement?.insertBefore(listItem, parentItem.nextSibling);
        if (!parentList.querySelector("li")) parentList.remove();
      }
      event.preventDefault();
      onChange?.(editorRef.current?.innerHTML ?? "");
    }
  };

  const handleInput = () => {
    const root = editorRef.current;
    const anchor = window.getSelection()?.anchorNode;
    const anchorElement = anchor?.nodeType === Node.ELEMENT_NODE ? anchor as HTMLElement : anchor?.parentElement;
    const placeholderBlock = anchorElement?.closest<HTMLElement>("[data-empty-block]");
    if (placeholderBlock?.textContent?.trim()) placeholderBlock.removeAttribute("data-empty-block");
    if (root) {
      const hasBlock = !!root.querySelector("h1, h2, h3, ul, ol, hr, .playbook-image-grid");
      setIsEmpty(!root.innerText.trim() && !hasBlock);
      onChange?.(root.innerHTML);
    }
    updateSlashMenu();
  };

  return (
    <div className="playbook-block-editor relative min-h-[1123px] w-full">
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { void addImages(event.currentTarget.files); event.currentTarget.value = ""; }} />
      <div
        ref={editorRef}
        role="textbox"
        aria-label="Playbook document"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-empty={isEmpty}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          setSlashMenuOpen(false);
          const target = event.target;
          if (target instanceof HTMLInputElement && target.type === "checkbox") {
            if (target.checked) target.setAttribute("checked", "checked");
            else target.removeAttribute("checked");
            onChange?.(editorRef.current?.innerHTML ?? "");
          }
        }}
        className="playbook-document-content min-h-[1123px] w-full whitespace-pre-wrap break-words text-[15px] text-foreground outline-none"
      />

      {isEmpty && !slashMenuOpen && (
        <span aria-hidden="true" className="pointer-events-none absolute left-[11%] top-[96px] text-[15px] leading-7 text-muted-foreground">
          Start writing, or type / for blocks…
        </span>
      )}

      {slashMenuOpen && (
        <div
          role="listbox"
          aria-label="Insert block"
          className="playbook-slash-menu absolute z-30 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {matchingOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={option.kind}
                type="button"
                role="option"
                aria-selected={index === activeOption}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyOption(option)}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${index === activeOption ? "bg-muted" : "hover:bg-muted/70"}`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground"><Icon size={16} /></span>
                <span>
                  <span className="block text-xs font-medium text-foreground">{option.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{option.description}</span>
                </span>
              </button>
            );
          })}
          {matchingOptions.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No matching blocks</p>}
        </div>
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6" role="dialog" aria-modal="true" aria-label={lightboxImage.title} onClick={() => setLightboxImage(null)}>
          <button type="button" className="absolute right-5 top-5 rounded-lg bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Close image" onClick={() => setLightboxImage(null)}><X size={20} /></button>
          <img src={lightboxImage.src} alt={lightboxImage.title} className="max-h-[90vh] max-w-[92vw] object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image"));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function createImageBlock(src: string, title: string, number: number, onView: (image: { src: string; title: string } | null) => void, onDelete: () => void) {
  let currentTitle = title;
  const figure = document.createElement("figure");
  figure.className = "playbook-image-block group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs";
  figure.contentEditable = "false";
  const preview = document.createElement("div");
  preview.className = "relative aspect-video w-full overflow-hidden bg-black/60";
  const image = document.createElement("img");
  image.src = src;
  image.alt = title;
  image.className = "h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105";
  image.addEventListener("click", () => onView({ src, title: currentTitle }));
  const badge = document.createElement("span");
  badge.className = "absolute left-1.5 top-1.5 z-10 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white";
  badge.textContent = `#${number}`;
  const overlay = document.createElement("div");
  overlay.className = "absolute inset-0 z-20 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100";
  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.title = "View Fullscreen";
  viewButton.className = "flex size-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30";
  viewButton.contentEditable = "false";
  viewButton.appendChild(makeIcon(Eye));
  viewButton.addEventListener("click", () => onView({ src, title: currentTitle }));
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.title = "Delete Image";
  deleteButton.className = "flex size-7 items-center justify-center rounded-lg bg-rose-500/80 text-white hover:bg-rose-500";
  deleteButton.contentEditable = "false";
  deleteButton.appendChild(makeIcon(Trash2));
  deleteButton.addEventListener("click", () => {
    figure.remove();
    onDelete();
  });
  overlay.append(viewButton, deleteButton);
  preview.append(image, badge, overlay);
  const caption = document.createElement("figcaption");
  caption.className = "border-t border-border/60 bg-muted/30 p-2 text-[11px] font-semibold text-foreground outline-none";
  caption.contentEditable = "true";
  caption.textContent = title;
  caption.addEventListener("input", () => {
    currentTitle = caption.textContent?.trim() || "Playbook image";
    image.alt = currentTitle;
  });
  figure.append(preview, caption);
  return figure;
}

function createImageUploadTile(onClick: () => void) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "playbook-image-upload group flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-secondary/15 p-3 text-center transition-all hover:border-violet-500/60 hover:bg-violet-500/5";
  tile.title = "Upload playbook image";
  tile.contentEditable = "false";
  tile.innerHTML = '<span class="flex size-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 transition-transform group-hover:scale-110"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg></span><span class="mt-1.5 text-[11px] font-semibold text-foreground transition-colors group-hover:text-violet-400">Add image</span><span class="font-mono text-[9px] text-foreground/60">PNG, JPG, WebP</span>';
  tile.addEventListener("click", onClick);
  return tile;
}

function makeIcon(Icon: typeof Eye | typeof Trash2) {
  const wrapper = document.createElement("span");
  wrapper.innerHTML = Icon === Eye
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.06 12.34a1 1 0 0 1 0-.68 10 10 0 0 1 19.88 0 1 1 0 0 1 0 .68 10 10 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
  return wrapper.firstElementChild!;
}

function addChecklistBox(item: HTMLLIElement) {
  if (item.querySelector("input[type='checkbox']")) return;
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("aria-label", "Mark item complete");
  checkbox.contentEditable = "false";
  const content = document.createElement("span");
  content.contentEditable = "true";
  Array.from(item.childNodes).forEach((child) => content.appendChild(child));
  if (!content.textContent?.trim()) content.innerHTML = "<br>";
  item.append(checkbox, content);
}

function removeChecklistBox(item: HTMLLIElement) {
  item.querySelector("input[type='checkbox']")?.remove();
  const content = item.querySelector("span[contenteditable='true']");
  if (content) {
    while (content.firstChild) item.insertBefore(content.firstChild, content);
    content.remove();
  }
}
