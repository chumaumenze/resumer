use simple_logger;

use log::info;
use std::error::Error;
// use serde_derive;
use lambda_runtime::{error::HandlerError, lambda, Context};
use serde::{Deserialize, Serialize};

mod lib;
use lib as latex2pdf;

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LambdaRequest {
    raw_input: String,
}

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::init_with_level(log::Level::Info)?;
    lambda!(lambda_handler);

    Ok(())
}

fn lambda_handler(e: LambdaRequest, c: Context) -> Result<latex2pdf::Response, HandlerError> {
    let raw_latex = e.raw_input;
    if raw_latex == "" {
        info!(
            "Request #{}: Empty [rawInput] field. Provide a latex string",
            c.aws_request_id
        );
        return Err(HandlerError::from(
            "[rawInput]: Empty field. Provide a latex string",
        ));
    }
    return match latex2pdf::latex2pdf(raw_latex) {
        Some(v) => Ok(v),
        _ => Err(HandlerError::from("Error")),
    };
}
