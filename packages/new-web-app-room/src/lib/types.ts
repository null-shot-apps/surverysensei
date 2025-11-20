export interface Survey {
  id: string;
  title: string;
  description: string;
  tokenAddress: string; // "NATIVE" for ETH or token contract address
  totalReward: number;
  targetRespondents: number;
  creatorWallet: string;
  escrowAddress: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAID' | 'EXPIRED';
  deadline: Date;
  createdAt: Date;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'boolean';
  options?: string[]; // For multiple choice
  required: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  walletAddress: string;
  answers: Answer[];
  timestamp: Date;
  txHash?: string; // Transaction hash for reward distribution
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
}

export interface RewardDistribution {
  id: string;
  surveyId: string;
  walletAddress: string;
  amount: number;
  txHash: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp: Date;
}

export interface CreateSurveyRequest {
  title: string;
  description: string;
  tokenAddress: string;
  totalReward: number;
  targetRespondents: number;
  creatorWallet: string;
  deadline: Date;
  questions: Omit<Question, 'id'>[];
}

export interface SubmitResponseRequest {
  surveyId: string;
  walletAddress: string;
  answers: Omit<Answer, 'id'>[];
}

export interface SurveyStatus {
  survey: Survey;
  responsesCount: number;
  rewardPerRespondent: number;
  remainingSlots: number;
  isExpired: boolean;
  canDistribute: boolean;
}
