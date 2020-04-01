using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace webwallet.Controllers
{
    [Route("api/[controller]")]
    public partial class LoginController : Controller
    {
        private readonly IConfiguration _config;
        private readonly IHostingEnvironment _env;

        public LoginController(IConfiguration configuration, IHostingEnvironment env)
        {
            this._config = configuration;
            this._env = env;
        }

        [HttpPost("[action]")]
        public async Task<ClientToken> GetClientToken([FromBody] ClientLoginRequest request, Boolean? mock = false)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (!Recaptcha.IsValid(request.responseRecaptcha, _env, _config))
            {
                ClientToken ct = new ClientToken();
                ct.error = "Invalid captcha validation";
                ct.error_description = "Invalid captcha validation";
                return ct;
            }

            var BaseURL = this._config["AppApiDomain"] + "/api/user/authenticate";

            if (mock.HasValue && mock.Value)
            {
                BaseURL = "http://" + this.Request.Host.Value + ("/mocks/get-token.json");
                return new ClientToken { access_token = "token" };
            }

            var postData = new List<KeyValuePair<string, string>>();
            //postData.Add(new KeyValuePair<string, string>("client_id", this._config["client_id"]));
            //postData.Add(new KeyValuePair<string, string>("client_secret", this._config["client_secret"]));
            //postData.Add(new KeyValuePair<string, string>("client_type", "webclient"));
            //postData.Add(new KeyValuePair<string, string>("grant_type", "password"));
            postData.Add(new KeyValuePair<string, string>("username", request.username));
            postData.Add(new KeyValuePair<string, string>("password", request.password));
            postData.Add(new KeyValuePair<string, string>("TwoFactorAuthentication", request.twoFactorAuthentication));
            postData.Add(new KeyValuePair<string, string>("client_ip", this.Request.HttpContext.Connection.RemoteIpAddress.ToString()));


            using (var httpClient = new HttpClient())
            {
                using (var content = new FormUrlEncodedContent(postData))
                {
                    content.Headers.Clear();
                    content.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
                    var response = await httpClient.PostAsync(BaseURL, content);
                    var stringResponse = await response.Content.ReadAsStringAsync();
                    var token = JsonConvert.DeserializeObject<ClientToken>(stringResponse);
                    return token;
                }
            }
        }

        public class Client
        {
            public string client_id { get; set; }
            public string client_secret { get; set; }
        }

        public class ClientToken
        {
            public string access_token { get; set; }
            public string error { get; set; }
            public string error_description { get; set; }
            public DateTime expires_in { get; set; }
            public string refresh_token { get; set; }
            public string token_type { get; set; }
        }
    }
}