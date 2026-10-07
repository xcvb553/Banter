namespace Banter.Services
{
    public class FileStorageService
    {
        private readonly IWebHostEnvironment _env;

        public FileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string> SaveAsync(IFormFile file, string folder)
        {
            var directory = Path.Combine(GetWebRoot(), folder);
            Directory.CreateDirectory(directory);

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(directory, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/{folder}/{fileName}";
        }

        public void Delete(string? url)
        {
            if (string.IsNullOrEmpty(url) || !url.StartsWith('/'))
                return;

            var filePath = Path.Combine(GetWebRoot(), url.TrimStart('/'));
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }

        private string GetWebRoot()
        {
            return _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        }
    }
}
