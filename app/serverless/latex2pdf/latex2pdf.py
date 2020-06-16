import traceback

from lib.latex2pdf import latex2pdf


def main(e, c):
    response_data = {
        'status': 'success',
        'message': None,
        'data': {
            'log': None,
            'pdf': None,
            'debug': None
        }
    }
    if not e.get('rawInput'):
        response_data['status'] = 'failure'
        response_data['message'] = '[rawInput]: Provide a valid LateX input'
        return response_data

    raw_latex = e['rawInput']
    try:
         pdf, log, cp = latex2pdf(raw_latex, exec_path="pdftex")
    except Exception as e:
        traceback.print_exc()
        response_data['status'] = 'error'
        response_data['message'] = f'Error occur: {str(e)}'
    else:
        response_data['data']['pdf'] = pdf
        response_data['data']['log'] = log
        response_data['data']['debug'] = {
            'args': cp.args, 'returncode': cp.returncode,
            'stdout': cp.stdout, 'stderr': cp.stderr
        }
        if pdf is None:
            response_data['status'] = 'failure'

    return response_data
