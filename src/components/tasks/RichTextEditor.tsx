import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, ListChecks, Link2, Pilcrow } from "lucide-react";

const PURIFY = {
  ALLOWED_TAGS: ["h2", "h3", "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "div", "span", "blockquote"],
  ALLOWED_ATTR: ["href", "target", "rel", "data-checklist", "data-checked"],
};

export function sanitizeHtml(html: string) {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, PURIFY) as string;
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Descrições antigas eram texto puro: converte para parágrafos. */
export function toHtml(v: string | null | undefined) {
  const s = v ?? "";
  if (!s.trim()) return "";
  if (/<\/?(p|h2|h3|ul|ol|li|strong|em|a|br|div)\b/i.test(s)) return sanitizeHtml(s);
  return s.split(/\n{2,}/).map((b) => `<p>${escape(b).replace(/\n/g, "<br>")}</p>`).join("");
}

/**
 * Editor leve (sem dependência pesada): títulos, parágrafos, listas, checklist,
 * negrito, itálico e links. Salva HTML sanitizado.
 */
export function RichTextEditor({ value, onSave, placeholder }: { value: string; onSave: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string>("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const html = toHtml(value);
    if (ref.current && html !== last.current) {
      ref.current.innerHTML = html;
      last.current = html;
    }
  }, [value]);

  const commit = () => {
    if (!ref.current) return;
    const html = sanitizeHtml(ref.current.innerHTML);
    const clean = ref.current.textContent?.trim() || /data-checklist/.test(html) ? html : "";
    if (clean === last.current) return;
    last.current = clean;
    onSave(clean);
  };
  const schedule = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(commit, 800);
  };
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    schedule();
  };
  const caretAt = (el: Node, end = true) => {
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(!end);
    const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
  };
  const currentBlock = (): HTMLElement | null => {
    let n: Node | null = window.getSelection()?.anchorNode ?? null;
    while (n && n.parentNode && n.parentNode !== ref.current) n = n.parentNode;
    return n && n.parentNode === ref.current && n.nodeType === 1 ? (n as HTMLElement) : null;
  };
  const closestLi = (): HTMLLIElement | null => {
    let n: Node | null = window.getSelection()?.anchorNode ?? null;
    while (n && n !== ref.current) { if ((n as HTMLElement).tagName === "LI") return n as HTMLLIElement; n = n.parentNode; }
    return null;
  };
  /** Transforma somente o bloco atual em checklist (nunca aninha lista dentro de parágrafo). */
  const checklist = () => {
    const root = ref.current; if (!root) return;
    root.focus();
    const block = currentBlock();
    if (block && (block.tagName === "UL" || block.tagName === "OL")) {
      block.setAttribute("data-checklist", "true");
      block.querySelectorAll(":scope > li").forEach((li) => { if (!li.hasAttribute("data-checked")) li.setAttribute("data-checked", "false"); });
      schedule(); return;
    }
    const ul = document.createElement("ul"); ul.setAttribute("data-checklist", "true");
    const li = document.createElement("li"); li.setAttribute("data-checked", "false");
    li.innerHTML = block && block.textContent?.trim() ? block.innerHTML : "<br>";
    ul.appendChild(li);
    if (block) block.replaceWith(ul); else root.appendChild(ul);
    caretAt(li); schedule();
  };
  /** Enter em item vazio sai da lista e cria um parágrafo abaixo. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const li = closestLi(); if (!li) return;
    const list = li.parentElement as HTMLElement;
    if (!li.textContent?.trim()) {
      e.preventDefault();
      const p = document.createElement("p"); p.innerHTML = "<br>";
      const after = Array.from(list.children).slice(Array.from(list.children).indexOf(li) + 1);
      li.remove();
      list.after(p);
      if (after.length) { const rest = list.cloneNode(false) as HTMLElement; after.forEach((x) => rest.appendChild(x)); p.after(rest); }
      if (!list.children.length) list.remove();
      caretAt(p, false); schedule();
    } else if (list.hasAttribute("data-checklist")) {
      window.setTimeout(() => { const n = closestLi(); if (n && n !== li) n.setAttribute("data-checked", "false"); }, 0);
    }
  };
  const link = () => {
    const url = window.prompt("Endereço do link (https://...)");
    if (!url) return;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    exec("createLink", href);
    ref.current?.querySelectorAll("a").forEach((a) => { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer"); });
    schedule();
  };

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    const a = t.closest("a");
    if (a && (e.metaKey || e.ctrlKey)) { window.open(a.getAttribute("href") ?? "", "_blank", "noopener"); return; }
    if (t.tagName === "LI" && t.parentElement?.hasAttribute("data-checklist")) {
      const rect = t.getBoundingClientRect();
      if (e.clientX - rect.left < 22) {
        e.preventDefault();
        t.setAttribute("data-checked", t.getAttribute("data-checked") === "true" ? "false" : "true");
        schedule();
      }
    }
  };

  const Btn = ({ onClick: fn, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) => (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => { e.preventDefault(); fn(); }}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );

  return (
    <div className="rounded-md border border-transparent focus-within:border-border">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-1 py-1">
        <Btn onClick={() => exec("formatBlock", "<h2>")} label="Título"><Heading2 size={15} /></Btn>
        <Btn onClick={() => exec("formatBlock", "<h3>")} label="Subtítulo"><Heading3 size={15} /></Btn>
        <Btn onClick={() => exec("formatBlock", "<p>")} label="Parágrafo"><Pilcrow size={15} /></Btn>
        <span className="mx-1 h-4 w-px bg-border" />
        <Btn onClick={() => exec("bold")} label="Negrito"><Bold size={15} /></Btn>
        <Btn onClick={() => exec("italic")} label="Itálico"><Italic size={15} /></Btn>
        <Btn onClick={link} label="Link"><Link2 size={15} /></Btn>
        <span className="mx-1 h-4 w-px bg-border" />
        <Btn onClick={() => exec("insertUnorderedList")} label="Lista"><List size={15} /></Btn>
        <Btn onClick={() => exec("insertOrderedList")} label="Lista numerada"><ListOrdered size={15} /></Btn>
        <Btn onClick={checklist} label="Checklist"><ListChecks size={15} /></Btn>
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-label="Descrição da tarefa"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? "Briefing, roteiro, instruções, referências, anotações…"}
        onFocus={() => { document.execCommand("defaultParagraphSeparator", false, "p"); if (ref.current && !ref.current.innerHTML.trim()) { ref.current.innerHTML = "<p><br></p>"; } }}
        onInput={schedule}
        onKeyDown={onKeyDown}
        onBlur={commit}
        onClick={onClick}
        className="rte min-h-[160px] px-3 py-2 text-[14px] leading-relaxed text-foreground outline-none"
      />
    </div>
  );
}
