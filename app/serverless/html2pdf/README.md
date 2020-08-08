# HTML2PDF

A serverless function for generating PDF documents from URLs, Pug and HTML. 
Based on RelaxedJS & Puppeteer.  
Provides quick setup & deployment to AWS Lambda & Google Cloud Functions.


## Usage

### AWS

#### Requirements

+ AWS Lambda Nodejs runtime 10.x, 12.x
+ Docker
+ File-watching utility such as `nodemon` or `entr`

#### Function Payload

The function expects a JSON payload. Your payload must include the following values:

+ `type` - The type of value provided. Allowed values are `url` and `string`.
+ `format` - The format of the value if `type` is `string`. Accepted values are `pug` and `html`.
+ `value` - The raw value can be a URL, HTML or Pug. 

For example:

```json
{
  "type": "url",
  "format": null,
  "value": "https://google.com"
}
```

#### Installing dependencies

```bash
docker run --rm --workdir=/app \
  -e PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  -v "$PWD":/app \
  -v "$PWD"/nodejs/node_modules:/app/node_modules \
  lambci/lambda:build-nodejs12.x \
  bash -c "npm i -g yarn && yarn install && yarn autoclean --force"
```

#### Emulate AWS Lambda hosting the function

```bash
find ./ -name "*.js*" -not -path "*node_modules*" | \
  entr -cr docker run --rm \
  -e DOCKER_LAMBDA_STAY_OPEN=1 \
  -e AWS_LAMBDA_FUNCTION_NAME=html2pdf \
  -p 9001:9001 \
  -v "$PWD":/var/task:ro,delegated \
  -v "$PWD"/nodejs/node_modules:/opt/nodejs/node_modules:ro,delegated \
  lambci/lambda:nodejs12.x html2pdf.main
```

#### Invoke the function locally
```bash
aws lambda invoke \
  --endpoint http://localhost:9001 
  --no-sign-request \
  --function-name=html2pdf \
  --invocation-type=RequestResponse \
  --payload $(echo '{"type": "string", "format": "pug", "value": "h1 Hello World!\np My name is Zuko"}' | base64 ) \
  output.json
```
