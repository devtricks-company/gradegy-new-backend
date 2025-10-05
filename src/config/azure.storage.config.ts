import { registerAs } from "@nestjs/config";

export default registerAs('azurestorage',() => ({
     connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    storageName: process.env.AZURE_STORAGE_CONTAINER_NAME,
}))