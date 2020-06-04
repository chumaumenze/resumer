use super::*;

mod tests {
    #[test]
    fn latex2pdf_with_valid_latex() {
        let latex = r#"
        \documentclass{article}
        \begin{document}
        Hello, world!
        \end{document}
        "#
        .to_string();
        let pdf = latex2pdf(latex);
        print!("Hello {s}", s = s);
    }
}
fn main() {
    let latex = r#"
    \documentclass{article}
    \begin{document}
    Hello, world!
    \end{document}
    "#
    .to_string();
    let res = latex2pdf(latex);

    println!("###Response###:\n{:#?}", serde_json::to_string(&res));
    // println!("###Response###:\n{:#?}", res);
}
