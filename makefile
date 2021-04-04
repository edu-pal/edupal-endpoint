appsync:
	@yarn build
	@echo "\n\n🚀 Deploying Core AppSync API to development!\n"
	@cd resources/shared-appsync; \
	sls deploy

realtime-database:
	@echo "\n\n🚀 Deploying Realtime API's DynamoDB Table to development!\n"
	@cd src/services/realtime-api/database; \
	sls deploy

realtime-api:
	@make appsync
	@make _realtime-api

cognito:
	@echo "\n\n🚀 Deploying Cognito User and Identity Pool to development!\n"
	@cd resources/cognito; \
	sls deploy

# WARNING: DO NOT EXECUTE. This re-deploys ALL resources, it is not what you want. Deploy individually instead.
_all:
	@make cognito
	@make appsync
	@make realtime-database
	@make _realtime-api
	@echo "\n\n🍻 Success!"


appsync-prod:
	@yarn build
	@echo "\n\n\🚀 Deploying Core AppSync API to:\nPRODUCTION\n"
	@cd resources/shared-appsync; \
	sls deploy --stage prod

realtime-database-prod:
	@echo "\n\n🚀 Deploying Realtime API's DynamoDB Table to:\nPRODUCTION!\n"
	@cd src/services/realtime-api/database
	sls deploy --stage prod; \

_realtime-api:
	@yarn build
	@echo "\n\n🚀 Realtime API to development!\n"
	@cd src/services/realtime-api; \
	sls deploy

_realtime-api-prod:
	@yarn build
	@echo "\n\n🚀 Realtime API to:\nPRODUCTION!\n"
	@cd src/services/realtime-api; \
	sls deploy --stage prod	
	
realtime-api-prod:
	@make appsync-prod
	@make _realtime-api-prod

cognito-prod:
	@echo "\n\n🚀 Deploying Cognito User and Identity Pool to:\nPRODUCTION!\n"
	@cd resources/cognito; \
	sls deploy --stage prod

# STRONG WARNING: DO NOT EXECUTE. This replaces EVERYTHING in production, it is not what you want. Deploy individually instead.
_all-prod:
	@make cognito-prod
	@make appsync-prod
	@make realtime-database-prod
	@make _realtime-api-prod
	@echo "\n\n🍻 Success!"