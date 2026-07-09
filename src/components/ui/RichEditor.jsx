import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image'],
  ['blockquote', 'code-block'],
  ['clean'],
];

const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent', 'align',
  'link', 'image', 'blockquote', 'code-block',
];

/**
 * Rich text (WYSIWYG) editor that outputs HTML.
 * Used for legal documents and any content that needs to be served as HTML to the mobile app.
 */
export default function RichEditor({ value, onChange }) {
  // Clean Quill output: remove empty paragraphs, fix PDF paste artifacts
  const handleChange = (html) => {
    let cleaned = html || '';
    // Replace &nbsp; with normal spaces (PDF paste encodes all spaces as nbsp)
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    // Remove empty paragraphs that Quill inserts (<p><br></p>)
    cleaned = cleaned.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
    // Remove empty paragraphs
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    // Collapse multiple <br> into one
    cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');
    onChange(cleaned);
  };

  return (
    <div className="rich-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={{ toolbar: TOOLBAR }}
        formats={FORMATS}
        placeholder="Start writing… use the toolbar for headings, bold, lists, links, etc."
        style={{ minHeight: '400px' }}
      />
      <style>{`
        .rich-editor-wrapper .ql-container { min-height: 380px; font-size: 15px; }
        .rich-editor-wrapper .ql-editor { min-height: 360px; }
        .rich-editor-wrapper .ql-toolbar { border-radius: 8px 8px 0 0; border-color: #e5e7eb; }
        .rich-editor-wrapper .ql-container { border-radius: 0 0 8px 8px; border-color: #e5e7eb; }
      `}</style>
    </div>
  );
}
