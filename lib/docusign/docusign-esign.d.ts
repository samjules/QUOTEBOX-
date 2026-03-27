declare module 'docusign-esign' {
  export class ApiClient {
    setBasePath(basePath: string): void
    addDefaultHeader(key: string, value: string): void
    requestJWTUserToken(
      integrationKey: string,
      userId: string,
      scopes: string[],
      privateKey: Buffer,
      expiresIn: number,
    ): Promise<{ body: { access_token: string; expires_in: number } }>
  }

  export class EnvelopesApi {
    constructor(apiClient: ApiClient)
    createEnvelope(
      accountId: string,
      opts: { envelopeDefinition: EnvelopeDefinition },
    ): Promise<{ envelopeId: string; status: string }>
  }

  export class EnvelopeDefinition {
    emailSubject?: string
    emailBlurb?: string
    status?: string
    documents?: Document[]
    recipients?: Recipients
  }

  export class Document {
    documentBase64?: string
    name?: string
    fileExtension?: string
    documentId?: string
  }

  export class Recipients {
    signers?: Signer[]
  }

  export class Signer {
    email?: string
    name?: string
    recipientId?: string
    routingOrder?: string
    tabs?: Tabs
  }

  export class Tabs {
    signHereTabs?: SignHere[]
    dateSignedTabs?: DateSigned[]
  }

  export class SignHere {
    anchorString?: string
    anchorUnits?: string
    anchorXOffset?: string
    anchorYOffset?: string
  }

  export class DateSigned {
    anchorString?: string
    anchorUnits?: string
    anchorXOffset?: string
    anchorYOffset?: string
  }
}
