export interface PlatformInfo {
  platform: string;
  name: string;
  image: string;
  description: string;
}

export interface LinkConfig {
  platforms: string[];
  companyName: string;
  companyLogoDark: string;
  companyLogoLight: string;
  welcomeMessage: string;
  successMessage: string;
}
