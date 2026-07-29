export type WhatsAppTemplateMessage = {
  destinationNumber: string;
  templateName: string;
  languageCode: string;
  bodyParameters: string[];
};

export type WhatsAppSendResult =
  | {
      ok: true;
      providerMessageId: string;
    }
  | {
      ok: false;
      errorCode: string;
      retryable: boolean;
    };

export type WhatsAppProvider = {
  sendTemplate(
    message: WhatsAppTemplateMessage,
  ): Promise<WhatsAppSendResult>;
};
