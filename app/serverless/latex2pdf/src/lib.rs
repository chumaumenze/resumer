use tectonic;

use base64::encode as b64encode;
use log::debug;
use serde::{Deserialize, Serialize};
use std::option::Option;

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
enum ResponseStatus {
    Success,
    Error,
    Failure,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct ResponseData {
    log: Option<String>,
    pdf: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct Response {
    status: ResponseStatus,
    message: Option<String>,
    data: ResponseData,
}

pub fn latex2pdf(raw_latex: String) -> Option<Response> {
    let mut response_data = Response {
        status: ResponseStatus::Success,
        message: None,
        data: ResponseData {
            log: None,
            pdf: None,
        },
    };

    let parsed_pdf_result = tectonic::latex_to_pdf(raw_latex);
    response_data.data.pdf = match parsed_pdf_result {
        Ok(raw_pdf) => {
            let pdf_data_uri = format!("data:application/pdf;base64,{}", b64encode(&raw_pdf));
            Some(pdf_data_uri)
        }
        Err(e) => {
            let trace_back = format!("{:?}", e.backtrace()?);
            debug!("{}", trace_back);
            response_data.data.log = Some(trace_back);
            response_data.status = ResponseStatus::Error;
            response_data.message = Some(e.description().to_string());
            None
        }
    };
    return Some(response_data);
}

#[cfg(test)]
mod tests {
    fn run_latex2pdf_test(latex: String) -> bool {
        let pdf_res = super::latex2pdf(latex);
        match pdf_res {
            Some(res) if res.status == super::ResponseStatus::Success => {
                let (pdf_data_uri, b64_end) = ("data:application/pdf;base64,", "JUVPRgo=");
                if let Some(s) = res.data.pdf {
                    s.starts_with(pdf_data_uri) && s.ends_with(b64_end)
                } else {
                    false
                }
            }
            _ => false,
        }
    }

    #[test]
    fn latex2pdf_with_valid_latex() {
        let latex = r#"
        \documentclass{article}
        \begin{document}
        Hello, world!
        \end{document}
        "#
        .to_string();
        // print!("{r:#?}", r = &pdf_res);
        let is_match = run_latex2pdf_test(latex);
        assert!(is_match, "Valid latex was converted to valid PDF type");
    }

    #[test]
    fn latex2pdf_with_invalid_latex() {
        let latex = r#"
        \documentclass{article}
        "#
        .to_string();
        let is_match = run_latex2pdf_test(latex);
        assert!(
            !is_match,
            "The function returned valid output on invalid latex"
        );
    }
}
