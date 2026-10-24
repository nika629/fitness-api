namespace WebApplicationLB.Domain.Constants
{
    // Must match "DictionaryCaption" of the role rows in the Dictionaries table.
    public static class RoleNames
    {
        public const string Admin = "Admin";
        public const string User = "User";
    }

    // "DictionaryGroupIntCode" values in the Dictionaries table.
    public static class DictionaryGroups
    {
        public const int Roles = 1;
        public const int Equipment = 2;
        public const int MuscleGroups = 3;
    }
}
