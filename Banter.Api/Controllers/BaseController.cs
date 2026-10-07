using Banter.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Banter.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public abstract class BaseController : ControllerBase
    {
        protected Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        protected IActionResult HandleResult<T>(Result<T> result)
        {
            if (!result.IsSuccess)
                return Error(result);

            return Ok(result.Data);
        }

        protected IActionResult HandleResult(Result result)
        {
            if (!result.IsSuccess)
                return Error(result);

            return NoContent();
        }

        private IActionResult Error(Result result)
        {
            var body = new { message = result.Message };
            return result.Error switch
            {
                ErrorType.NotFound => NotFound(body),
                ErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, body),
                _ => BadRequest(body)
            };
        }
    }
}
