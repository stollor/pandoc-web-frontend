import { marked } from 'marked';
import DOMPurify from 'dompurify';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { FileFormat } from './useConverterStore';

// 将不同格式的输入转换为安全的 HTML（核心中间态）
export const convertToHtml = async (text: string, inputFormat: FileFormat): Promise<string> => {
  let rawHtml = '';
  
  if (inputFormat === 'markdown') {
    rawHtml = await marked.parse(text);
  } else if (inputFormat === 'html') {
    rawHtml = text;
  } else {
    // 对于 LaTeX, RST 等复杂格式，纯前端库支持有限
    // 这里提供一个优雅的降级处理，将它们作为普通文本处理，并保留格式提示
    rawHtml = `
      <div style="color: #666; font-style: italic; margin-bottom: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
        Note: True conversion for ${inputFormat} requires backend Pandoc. 
        Displaying as preformatted text in local mode.
      </div>
      <pre><code>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
    `;
  }

  // 始终净化 HTML 防止 XSS
  return DOMPurify.sanitize(rawHtml);
};

// 将 HTML 转换为最终所需格式的内容或触发下载
export const convertFromHtml = async (html: string, outputFormat: FileFormat, originalText: string): Promise<string | null> => {
  if (outputFormat === 'html') {
    return html;
  }
  
  if (outputFormat === 'markdown') {
    // 简单的降级处理（真实场景可以使用 turndown 库，但为了控制包体积这里简化）
    return originalText || html.replace(/<[^>]*>?/gm, '');
  }

  if (outputFormat === 'docx') {
    return `纯前端降级模式下暂不支持生成真正的 Word 文档，请等待 WebAssembly 引擎加载完成。`;
  }

  if (outputFormat === 'epub') {
    try {
      // 在浏览器中生成简单的 EPUB 结构
      const zip = new JSZip();
      
      // mimetype
      zip.file('mimetype', 'application/epub+zip');
      
      // META-INF/container.xml
      const metaInf = zip.folder('META-INF');
      metaInf?.file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

      // OEBPS
      const oebps = zip.folder('OEBPS');
      oebps?.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>Converted Document</dc:title>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`);
      
      oebps?.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:12345"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>Converted Document</text></docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>Content</text></navLabel>
      <content src="content.html"/>
    </navPoint>
  </navMap>
</ncx>`);

      oebps?.file('content.html', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Content</title></head>
<body>${html}</body>
</html>`);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `converted_${Date.now()}.epub`);
      
      return `文件已成功转换为 EPUB 电子书并开始下载！\n\n所有运算均在您的浏览器本地安全完成，未上传任何数据。`;
    } catch (e) {
      console.error('EPUB conversion failed', e);
      throw new Error('EPUB 电子书生成失败');
    }
  }

  if (outputFormat === 'pdf') {
    try {
      // Create a temporary hidden div to hold the HTML for rendering
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Apply github-markdown style classes and base typography
      tempDiv.className = 'markdown-body';
      tempDiv.style.padding = '30px';
      tempDiv.style.color = '#24292e';
      tempDiv.style.background = '#ffffff';
      
      // Inject github-markdown-css explicitly for the PDF renderer
      const styleElement = document.createElement('style');
      styleElement.innerHTML = `
        .markdown-body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"; font-size: 16px; line-height: 1.5; word-wrap: break-word; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
        .markdown-body h1 { font-size: 2em; padding-bottom: .3em; border-bottom: 1px solid #eaecef; }
        .markdown-body h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid #eaecef; }
        .markdown-body h3 { font-size: 1.25em; }
        .markdown-body h4 { font-size: 1em; }
        .markdown-body p, .markdown-body blockquote, .markdown-body ul, .markdown-body ol, .markdown-body dl, .markdown-body table, .markdown-body pre, .markdown-body details { margin-top: 0; margin-bottom: 16px; }
        .markdown-body ul, .markdown-body ol { padding-left: 2em; list-style: inherit; }
        .markdown-body blockquote { padding: 0 1em; color: #6a737d; border-left: .25em solid #dfe2e5; }
        .markdown-body table { display: block; width: 100%; overflow: auto; border-collapse: collapse; }
        .markdown-body table th { font-weight: 600; }
        .markdown-body table th, .markdown-body table td { padding: 6px 13px; border: 1px solid #dfe2e5; }
        .markdown-body table tr { background-color: #fff; border-top: 1px solid #c6cbd1; }
        .markdown-body table tr:nth-child(2n) { background-color: #f6f8fa; }
        .markdown-body img { max-width: 100%; box-sizing: content-box; background-color: #fff; }
        .markdown-body code { padding: .2em .4em; margin: 0; font-size: 85%; background-color: rgba(27,31,35,.05); border-radius: 3px; font-family: SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace; }
        .markdown-body pre { word-wrap: normal; padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; }
        .markdown-body pre code { display: inline; max-width: auto; padding: 0; margin: 0; overflow: visible; line-height: inherit; word-wrap: normal; background-color: transparent; border: 0; }
        .markdown-body a { color: #0366d6; text-decoration: none; }
        .markdown-body hr { height: .25em; padding: 0; margin: 24px 0; background-color: #e1e4e8; border: 0; }
      `;
      tempDiv.appendChild(styleElement);
      
      document.body.appendChild(tempDiv);
      
      const opt = {
        margin:       10,
        filename:     `converted_${Date.now()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(tempDiv).save();
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      return `文件已成功转换为 PDF 并开始下载！\n\n所有运算均在您的浏览器本地安全完成，未上传任何数据。`;
    } catch (e) {
      console.error('PDF conversion failed', e);
      throw new Error('PDF 文件生成失败');
    }
  }

  // 降级文本展示
  return `纯前端模式下暂不支持直接输出为 ${outputFormat}。\n\n目前支持最好的纯前端导出格式为 HTML、Markdown、Word (.docx) 和 EPUB。`;
};
