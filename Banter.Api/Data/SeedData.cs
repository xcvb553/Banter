using Banter.Models;
using Banter.Utils;
using Microsoft.AspNetCore.Identity;

namespace Banter.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration, ILogger logger)
        {
            using var scope = services.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await context.Database.EnsureCreatedAsync();

            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            foreach (var roleName in new[] { Roles.Admin, Roles.User })
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
                }
            }

            var adminName = configuration["Admin:UserName"];
            var adminEmail = configuration["Admin:Email"];
            var adminPassword = configuration["Admin:Password"];
            if (string.IsNullOrWhiteSpace(adminName) || string.IsNullOrWhiteSpace(adminPassword) || string.IsNullOrWhiteSpace(adminEmail))
                return;

            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            if (await userManager.FindByNameAsync(adminName) != null)
                return;

            var admin = new User { UserName = adminName, Email = adminEmail };
            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, Roles.Admin);
                logger.LogInformation("Admin account '{AdminName}' created", adminName);
            }
            else
            {
                logger.LogWarning("Could not create admin: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }
}
