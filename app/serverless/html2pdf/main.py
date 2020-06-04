from base64 import b64encode
from weasyprint import HTML


def main(e, c):
    response_data = {
        'status': 'success',
        'message': None,
        'data': {
            'log': None,
            'pdf': None
        }
    }
    if not e.get('rawInput'):
        response_data['status'] = 'failure'
        response_data['message'] = '[rawInput]: Provide a valid HTML input'
    else:
        raw_html = e['rawInput']
        try:
            response_data['data']['pdf'] = html2pdf(raw_html)
        except Exception as e:
            response_data['status'] = 'error'
            response_data['message'] = f'Error occur{str(e)}'

    return response_data


def html2pdf(raw_html: str):
    html = HTML(string=raw_html)
    raw_pdf = html.write_pdf()
    encoded_pdf = (
        f"data:application/pdf;base64,"
        f"{b64encode(raw_pdf).decode('utf-8')}"
    )
    return encoded_pdf
