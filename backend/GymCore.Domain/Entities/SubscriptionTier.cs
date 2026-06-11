using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class SubscriptionTier : Entity
    {
        public string Name { get; private set; }
        public decimal MonthlyPrice { get; private set; }
        
        // e.g. 0.20 means a 20% discount on personal training sessions
        public decimal DiscountPercentage { get; private set; }

        protected SubscriptionTier() { }

        public SubscriptionTier(string name, decimal monthlyPrice, decimal discountPercentage = 0)
        {
            Name = name;
            MonthlyPrice = monthlyPrice;
            DiscountPercentage = discountPercentage;
        }

        public void UpdateTier(string name, decimal price, decimal discount)
        {
            Name = name;
            MonthlyPrice = price;
            DiscountPercentage = discount;
            Update();
        }
    }
}