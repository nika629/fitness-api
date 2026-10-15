namespace WebApplicationLB.Domain.Entities
{
    internal record Dictionary
    {
        #region Properties
        public int DictionaryID { get; set; }
        public int? DictionaryParentID { get; set; }
        public int? DictionaryGroupIntCode { get; set; }
        public string DictionaryCaption { get; set; } = string.Empty;
        public int? DictionaryItemIntCode { get; set; }

        public Dictionary? Parent { get; set; }
        public List<Dictionary> Children { get; set; } = [];
        #endregion

        #region Foreign Properties
        public List<User> UsersRoles { get; set; } = [];
        public List<Exercise> ExercisesMuscleGroups { get; set; } = [];
        public List<Exercise> ExercisesEquipments { get; set; } = [];
        #endregion
    }
}