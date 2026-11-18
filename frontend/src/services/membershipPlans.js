const freeFeatures = {
  account: true,
  assessment: true,
  basicDashboard: true,
  educationalContent: true,
  aiAssistant: 'limited',
  wellnessTracking: 'basic',
  marketplace: true,
  individualPurchases: true,
  personalizedPlan: false,
  enhancedDashboard: false,
  supplementRecommendations: false,
  monthlyReview: false,
  expandedAssistant: false,
  nutritionGuidance: false,
  supplementManagement: false,
  memberDiscounts: false,
  analytics: false,
  premiumAssistant: false,
  extendedReviews: false,
  consultationBenefits: false,
  prioritySupport: false,
  enhancedProductBenefits: false,
}

const paidFeatures = {
  ...freeFeatures,
  aiAssistant: 'premium',
  wellnessTracking: 'advanced',
  personalizedPlan: true,
  enhancedDashboard: true,
  supplementRecommendations: true,
  monthlyReview: true,
  expandedAssistant: true,
  nutritionGuidance: true,
  supplementManagement: true,
  memberDiscounts: true,
  analytics: true,
  premiumAssistant: true,
  extendedReviews: true,
  consultationBenefits: true,
  prioritySupport: true,
  enhancedProductBenefits: true,
}

const freeFeatureLabels = [
  'Account and profile',
  'Basic health assessment',
  'Basic wellness dashboard',
  'Educational wellness information',
  'Limited AI assistant',
  'Basic wellness tracking',
  'Marketplace access',
  'Individual supplement purchases',
]

const paidFeatureLabels = [
  'Everything in Free',
  'Personalized wellness plan',
  'Enhanced dashboard and supplement recommendations',
  'Monthly AI wellness review',
  'Expanded and premium AI assistant',
  'Nutrition guidance and extended wellness reviews',
  'Supplement subscription management and eligible product discounts',
  'Advanced wellness analytics',
  'Nutrition consultation benefits, where available',
  'Priority support and enhanced product benefits',
]

export const membershipPlans = [
  { id: 'free', name: 'Free', price: 0, billingLabel: 'no charge', features: freeFeatures, featureLabels: freeFeatureLabels },
  { id: 'monthly', name: 'Monthly', price: 999, billingLabel: 'per month', features: paidFeatures, featureLabels: paidFeatureLabels },
  { id: 'yearly', name: 'Yearly', price: 10190, billingLabel: 'per year', features: paidFeatures, featureLabels: paidFeatureLabels },
]

export function formatMembershipPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
