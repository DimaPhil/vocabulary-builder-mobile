declare module "wink-lemmatizer" {
  const lemmatizer: {
    adjective(value: string): string;
    noun(value: string): string;
    verb(value: string): string;
  };

  export default lemmatizer;
}
