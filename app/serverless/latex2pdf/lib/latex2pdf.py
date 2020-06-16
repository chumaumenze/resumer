import base64

from uuid import uuid1

from lib.pdflatex import PDFLaTeX


def latex2pdf(raw_latex: str, to_base64: bool = True,
              exec_path: str = 'pdflatex'):
    pdfl = PDFLaTeX(raw_latex, __name__ + uuid1().hex, exec_path)
    pdf, log, cp = pdfl.create_pdf()

    if to_base64:
        pdf = pdf and base64.b64encode(pdf).decode('utf-8')

    return pdf, log, cp
