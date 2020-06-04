use tectonic;

use base64::encode as b64encode;
use log::debug;
use serde::{Deserialize, Serialize};
use std::option::Option;

#[derive(Debug, Deserialize, Serialize, Clone)]
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
            let pdf_str = String::from_utf8_lossy(&raw_pdf).to_string();
            let pdf_data_uri = format!("data:application/pdf;base64,{}", b64encode(pdf_str));
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
