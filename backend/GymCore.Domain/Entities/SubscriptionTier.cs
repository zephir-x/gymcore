using GymCore.Domain.Common;

namespace GymCore.Domain.Entities
{
    public class SubscriptionTier : Entity
    {
        public string Name { get; private set; }
        public decimal MonthlyPrice { get; private set; }
        
        protected SubscriptionTier() { }

        public SubscriptionTier(string name, decimal monthlyPrice)
        {
            Name = name;
            MonthlyPrice = monthlyPrice;
        }

        public void UpdateTier(string name, decimal price)
        {
            Name = name;
            MonthlyPrice = price;
            Update();
        }
    }
}