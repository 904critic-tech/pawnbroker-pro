# 🚀 Lambda Deployment Commands

## ✅ **READY TO DEPLOY - MINIMAL EFFORT REQUIRED**

Your Lambda deployment package is ready! Here are the **3 simple commands** you need to run:

### **Step 1: Update Lambda Function Code**
```bash
aws lambda update-function-code \
  --function-name pawnbroker-pricing-lambda \
  --zip-file fileb://lambda-deployment.zip \
  --region us-east-2
```

### **Step 2: Update Lambda Configuration**
```bash
aws lambda update-function-configuration \
  --function-name pawnbroker-pricing-lambda \
  --timeout 30 \
  --memory-size 512 \
  --region us-east-2
```

### **Step 3: Test the Function**
```bash
aws lambda invoke \
  --function-name pawnbroker-pricing-lambda \
  --payload '{"body":"{\"itemName\":\"iPhone 14 Pro\"}"}' \
  --region us-east-2 \
  response.json
```

## 🎯 **What This Does:**

✅ **Command 1**: Uploads the fixed code with all dependencies
✅ **Command 2**: Sets proper timeout (30s) and memory (512MB) for web scraping
✅ **Command 3**: Tests the function to make sure it works

## 📋 **Your Effort Required:**

1. **Copy/paste each command** into your terminal
2. **Wait 2-3 minutes** for deployment
3. **That's it!** Your Lambda will be fully operational

## 🔗 **After Deployment:**

Your Lambda function will be available at:
`https://5opd4n4a4yk4t2hs7efwcmplbm0cmidw.lambda-url.us-east-2.on.aws/`

## 🎉 **Expected Results:**

- ✅ Lambda function will return 200 status codes
- ✅ Pricing calculations will work properly
- ✅ eBay scraping will function correctly
- ✅ Your AWS Application Manager will show the Lambda resource

## 🚨 **If You Get Errors:**

If the function name doesn't exist, use this command first:
```bash
aws lambda create-function \
  --function-name pawnbroker-pricing-lambda \
  --runtime nodejs18.x \
  --role arn:aws:iam::606544231496:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout 30 \
  --memory-size 512 \
  --region us-east-2
```

**Total Time Required: 5 minutes maximum!**
