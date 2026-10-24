using System.ComponentModel.DataAnnotations;

namespace WebApplicationLB.Infrastructure.Services.FavoriteExercises
{
    public class FavoriteExerciseCreateDTO
    {
        [Range(1, int.MaxValue)]
        public int ExerciseID { get; set; }
    }
}
