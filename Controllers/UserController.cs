using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using static webwallet.Controllers.LoginController;

namespace webwallet.Controllers
{
  [Route("api/[controller]")]
  public partial class UserController : Controller
  {
    private readonly IConfiguration _config;
    private readonly IHostingEnvironment _env;

    public UserController(IConfiguration configuration, IHostingEnvironment env)
    {
      this._config = configuration;
      this._env = env;
    }

    [HttpPost("[action]")]
    public async Task<dynamic> CreateUser([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }
      string responseRecaptcha = request.responseRecaptcha;
      if (!Recaptcha.IsValid(responseRecaptcha, _env, _config))
      {
        var createResponse = new
        {
          isValid = false,
          error = "Invalid captcha validation"
        };

        return createResponse;
      }

      using (var httpClient = new HttpClient())
      {
        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> DisableTwoFa([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }

      using (var httpClient = new HttpClient())
      {
        StringValues auth;
        this.Request.Headers.TryGetValue("Authorization", out auth);
        var authHeader = auth.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader))
          authHeader = authHeader.Replace("Bearer ", "");
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.FirstOrDefault().Replace("Bearer ", ""));

        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user/2fa/disable", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> DisableTwoFaRecovery([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }
      using (var httpClient = new HttpClient())
      {
        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user/disable2fa", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> EnableTwoFa([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }

      using (var httpClient = new HttpClient())
      {
        StringValues auth;
        this.Request.Headers.TryGetValue("Authorization", out auth);
        var authHeader = auth.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader))
          authHeader = authHeader.Replace("Bearer ", "");
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.FirstOrDefault().Replace("Bearer ", ""));

        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user/2fa/enable", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpGet("[action]")]
    public async Task<dynamic> Get(Boolean? mock = false)
    {
      try
      {
        var url = this._config["AppApiDomain"] + "/api/user/info";

        using (var httpClient = new HttpClient())
        {
          StringValues auth;
          this.Request.Headers.TryGetValue("Authorization", out auth);
          var authHeader = auth.FirstOrDefault();
          if (!string.IsNullOrEmpty(authHeader))
            authHeader = authHeader.Replace("Bearer ", "");
          httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authHeader);

          var response = await httpClient.GetAsync(url);
          return JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
        }
      }
      catch (Exception ex)
      {
        throw new Exception("Error to get the user  =>  " + ex.Message);
      }
    }


    [HttpPost("[action]")]
    public async Task<dynamic> GetInfoWithKey([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }

      using (var httpClient = new HttpClient())
      {
        StringValues auth;
        this.Request.Headers.TryGetValue("Authorization", out auth);
        var authHeader = auth.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader))
          authHeader = authHeader.Replace("Bearer ", "");
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.FirstOrDefault().Replace("Bearer ", ""));

        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user/info", content);
          dynamic dynamicResponse = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return dynamicResponse;
        }
      }
    }


    [HttpGet("[action]")]
    public async Task<dynamic> GetNewKey(Boolean? mock = false)
    {
      try
      {
        var url = this._config["AppApiDomain"] + "/api/user/newkey";
        if (mock.HasValue && mock.Value)
          url = "http://" + this.Request.Host.Value + ("/mocks/new-key.json");

        using (var httpClient = new HttpClient())
        {
          var response = await httpClient.GetAsync(url);
          return JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
        }
      }
      catch (Exception ex)
      {
        throw new Exception("Error to get the user  =>  " + ex.Message);
      }
    }

    [HttpGet("[action]")]
    public async Task<dynamic> GetNewTwoFa(Boolean? mock = false)
    {
      try
      {
        using (var httpClient = new HttpClient())
        {
          StringValues auth;
          this.Request.Headers.TryGetValue("Authorization", out auth);
          var authHeader = auth.FirstOrDefault();
          if (!string.IsNullOrEmpty(authHeader))
            authHeader = authHeader.Replace("Bearer ", "");
          httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authHeader);

          var response = await httpClient.GetAsync(this._config["AppApiDomain"] + "/api/user/2FA/new");
          return JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
        }
      }
      catch (Exception ex)
      {
        throw new Exception("Error to get the user  =>  " + ex.Message);
      }
    }

    [HttpGet("[action]")]
    public async Task<dynamic> GetUserByName([FromQuery]string username, [FromQuery]string label)
    {
      try
      {
        using (var httpClient = new HttpClient())
        {
          var url = this._config["AppApiDomain"] + "/api/user/send/" + username.ToString();
          if (label != null)
          {
            url += "/" + label.ToString();
          }
          var response = await httpClient.GetAsync(url);
          return JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
        }
      }
      catch (Exception ex)
      {
        throw new Exception("Error to get the GetUserByName  =>  " + ex.Message);
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> PasswordReset([FromBody] ClientResetPasswordRequest request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }

      var postData = new List<KeyValuePair<string, string>>();
      postData.Add(new KeyValuePair<string, string>("client_id", this._config["client_id"]));
      postData.Add(new KeyValuePair<string, string>("client_secret", this._config["client_secret"]));
      postData.Add(new KeyValuePair<string, string>("client_type", "webclient"));
      postData.Add(new KeyValuePair<string, string>("grant_type", "password"));
      postData.Add(new KeyValuePair<string, string>("username", request.username));
      postData.Add(new KeyValuePair<string, string>("password", request.password));
      postData.Add(new KeyValuePair<string, string>("TwoFactorAuthentication", request.twoFactorAuthentication));
      postData.Add(new KeyValuePair<string, string>("RecoveryKey", request.recoveryKey));

      postData.Add(new KeyValuePair<string, string>("client_ip", this.Request.HttpContext.Connection.RemoteIpAddress.ToString()));

      using (var httpClient = new HttpClient())
      {
        using (var content = new FormUrlEncodedContent(postData))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user/passwordreset", content);
          var stringResponse = await response.Content.ReadAsStringAsync();
          dynamic token = JsonConvert.DeserializeObject<dynamic>(stringResponse);
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> Require2faToSend([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }

      using (var httpClient = new HttpClient())
      {
        StringValues auth;
        this.Request.Headers.TryGetValue("Authorization", out auth);
        var authHeader = auth.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader))
          authHeader = authHeader.Replace("Bearer ", "");
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.FirstOrDefault().Replace("Bearer ", ""));

        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user/2fa/require2faToSend", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPut("[action]")]
    public async Task<dynamic> UpdateUser([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }

      using (var httpClient = new HttpClient())
      {
        StringValues auth;
        this.Request.Headers.TryGetValue("Authorization", out auth);
        var authHeader = auth.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader))
          authHeader = authHeader.Replace("Bearer ", "");
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authHeader);

        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PutAsync(this._config["AppApiDomain"] + "/api/user", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }
  }
}