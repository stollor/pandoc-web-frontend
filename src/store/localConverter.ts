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
    try {
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>Export</title>
        </head>
        <body>
      `;
      const footer = "</body></html>";
      const fullHTML = header + html + footer;

      const blob = new Blob(['\ufeff', fullHTML], {
          type: 'application/msword;charset=utf-8'
      });
      
      saveAs(blob, `converted_${Date.now()}.doc`);
      return `文件已成功转换为 Word 兼容格式 (.doc) 并开始下载！\n\n所有运算均在您的浏览器本地安全完成，未上传任何数据。`;
    } catch (e) {
      console.error('Word conversion failed', e);
      throw new Error('Word 文档生成失败');
    }
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
      
      // Apply some basic styling for the PDF to look good
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#000';
      tempDiv.style.background = '#fff';
      
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
