import { 
  Survey, 
  SurveyResponse, 
  CreateSurveyRequest, 
  SubmitResponseRequest, 
  SurveyStatus,
  RewardDistribution 
} from './types';

// Mock database - in production this would be a real database
const surveys: Map<string, Survey> = new Map();
const responses: Map<string, SurveyResponse[]> = new Map();
const rewards: Map<string, RewardDistribution[]> = new Map();

// Shared escrow address for MVP
const ESCROW_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1";

export class SurveyMCPTools {
  /**
   * Create a new survey with escrow setup
   */
  static async createSurvey(request: CreateSurveyRequest): Promise<{
    surveyId: string;
    rewardPerRespondent: number;
    escrowAddress: string;
  }> {
    const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rewardPerRespondent = request.totalReward / request.targetRespondents;

    const survey: Survey = {
      id: surveyId,
      title: request.title,
      description: request.description,
      tokenAddress: request.tokenAddress,
      totalReward: request.totalReward,
      targetRespondents: request.targetRespondents,
      creatorWallet: request.creatorWallet,
      escrowAddress: ESCROW_ADDRESS,
      status: 'ACTIVE',
      deadline: request.deadline,
      createdAt: new Date(),
      questions: request.questions.map((q, index) => ({
        ...q,
        id: `q_${index + 1}`
      }))
    };

    surveys.set(surveyId, survey);
    responses.set(surveyId, []);
    rewards.set(surveyId, []);

    return {
      surveyId,
      rewardPerRespondent,
      escrowAddress: ESCROW_ADDRESS
    };
  }

  /**
   * Submit a response to a survey
   */
  static async submitResponse(request: SubmitResponseRequest): Promise<{
    success: boolean;
    message: string;
    responseId?: string;
  }> {
    const survey = surveys.get(request.surveyId);
    if (!survey) {
      return { success: false, message: "Survey not found" };
    }

    if (survey.status !== 'ACTIVE') {
      return { success: false, message: "Survey is not active" };
    }

    if (new Date() > survey.deadline) {
      return { success: false, message: "Survey has expired" };
    }

    const existingResponses = responses.get(request.surveyId) || [];
    
    // Check if wallet already submitted
    const hasSubmitted = existingResponses.some(r => r.walletAddress === request.walletAddress);
    if (hasSubmitted) {
      return { success: false, message: "Wallet has already submitted a response" };
    }

    // Check if quota is full
    if (existingResponses.length >= survey.targetRespondents) {
      return { success: false, message: "Survey quota is full" };
    }

    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const response: SurveyResponse = {
      id: responseId,
      surveyId: request.surveyId,
      walletAddress: request.walletAddress,
      answers: request.answers,
      timestamp: new Date()
    };

    existingResponses.push(response);
    responses.set(request.surveyId, existingResponses);

    // Check if we should trigger reward distribution
    if (existingResponses.length >= survey.targetRespondents) {
      await this.distributeRewards(request.surveyId);
    }

    return {
      success: true,
      message: "Response submitted successfully",
      responseId
    };
  }

  /**
   * Get survey status and progress
   */
  static async getSurveyStatus(surveyId: string): Promise<SurveyStatus | null> {
    const survey = surveys.get(surveyId);
    if (!survey) {
      return null;
    }

    const surveyResponses = responses.get(surveyId) || [];
    const responsesCount = surveyResponses.length;
    const rewardPerRespondent = survey.totalReward / survey.targetRespondents;
    const remainingSlots = Math.max(0, survey.targetRespondents - responsesCount);
    const isExpired = new Date() > survey.deadline;
    const canDistribute = responsesCount >= survey.targetRespondents || (isExpired && responsesCount > 0);

    return {
      survey,
      responsesCount,
      rewardPerRespondent,
      remainingSlots,
      isExpired,
      canDistribute
    };
  }

  /**
   * Distribute rewards to all participants
   */
  static async distributeRewards(surveyId: string): Promise<{
    success: boolean;
    message: string;
    distributedCount?: number;
  }> {
    const survey = surveys.get(surveyId);
    if (!survey) {
      return { success: false, message: "Survey not found" };
    }

    if (survey.status === 'PAID') {
      return { success: false, message: "Rewards already distributed" };
    }

    const surveyResponses = responses.get(surveyId) || [];
    if (surveyResponses.length === 0) {
      return { success: false, message: "No responses to reward" };
    }

    const rewardPerRespondent = survey.totalReward / survey.targetRespondents;
    const rewardDistributions: RewardDistribution[] = [];

    // Simulate blockchain transactions
    for (const response of surveyResponses) {
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const distribution: RewardDistribution = {
        id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        surveyId,
        walletAddress: response.walletAddress,
        amount: rewardPerRespondent,
        txHash,
        status: 'COMPLETED',
        timestamp: new Date()
      };
      rewardDistributions.push(distribution);
    }

    rewards.set(surveyId, rewardDistributions);
    
    // Update survey status
    survey.status = 'PAID';
    surveys.set(surveyId, survey);

    return {
      success: true,
      message: "Rewards distributed successfully",
      distributedCount: rewardDistributions.length
    };
  }

  /**
   * Get all surveys for a creator
   */
  static async getCreatorSurveys(creatorWallet: string): Promise<Survey[]> {
    return Array.from(surveys.values()).filter(s => s.creatorWallet === creatorWallet);
  }

  /**
   * Get survey by ID
   */
  static async getSurvey(surveyId: string): Promise<Survey | null> {
    return surveys.get(surveyId) || null;
  }

  /**
   * Get responses for a survey
   */
  static async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    return responses.get(surveyId) || [];
  }

  /**
   * Get reward distributions for a survey
   */
  static async getRewardDistributions(surveyId: string): Promise<RewardDistribution[]> {
    return rewards.get(surveyId) || [];
  }
}
