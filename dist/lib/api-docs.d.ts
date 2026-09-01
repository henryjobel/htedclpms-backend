type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export interface ApiEndpoint {
    method: ApiMethod;
    path: string;
    auth?: boolean;
    title: string;
    description?: string;
}
export interface ApiModule {
    name: string;
    basePath: string;
    description: string;
    endpoints: ApiEndpoint[];
}
export declare const apiModules: ApiModule[];
export declare function getApiCatalog(): {
    service: string;
    version: string;
    status: string;
    healthEndpoint: string;
    totalModules: number;
    totalEndpoints: number;
    auth: {
        type: string;
        loginUrl: string;
        header: string;
        defaultCredentials: {
            email: string;
            password: string;
        };
    };
    modules: ApiModule[];
};
export declare function renderApiDocsHtml(baseUrl: string): string;
export {};
//# sourceMappingURL=api-docs.d.ts.map