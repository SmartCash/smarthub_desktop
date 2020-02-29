using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace webwallet.Controllers
{
  [Route("api/[controller]")]
  public partial class WalletController : Controller
  {
    private readonly IConfiguration _config;
    private IMemoryCache _cache;

    public WalletController(IConfiguration configuration, IMemoryCache cache)
    {
      this._config = configuration;
      this._cache = cache;
    }

    [HttpPost("[action]")]
    public async Task<dynamic> CreateOrder([FromBody] dynamic request)
    {
      if (request == null)
      {
        throw new ArgumentNullException(nameof(request));
      }

      dynamic resp2fa = await Valid2fa(request);
      var valid = (bool)JsonConvert.DeserializeObject<dynamic>(resp2fa.ToString()).isValid;
      if (!valid)
      {
        return resp2fa;
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
          content.Headers.Add("Authorization-Token", this._config["MailAPISecret"]);
          var response = await httpClient.PostAsync(this._config["MailAPIDomain"] + "/apiorder/createOrder", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> ExportWallet([FromBody] dynamic request)
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
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/wallet/ExportPrivateKeys", content);
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
        var url = this._config["AppApiDomain"] + "/api/wallet/my";
        if (mock.HasValue && mock.Value)
          url = "http://" + this.Request.Host.Value + ("/mocks/new-wallet.json");

        using (var httpClient = new HttpClient())
        {
          StringValues auth;
          this.Request.Headers.TryGetValue("Authorization", out auth);
          var authHeader = auth.FirstOrDefault();
          if (!string.IsNullOrEmpty(authHeader))
          {
            authHeader = authHeader.Replace("Bearer ", "");
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authHeader);
          }
          var response = await httpClient.GetAsync(url);
          return JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
        }
      }
      catch (Exception ex)
      {
        throw new Exception("Error to get the wallet  =>  " + ex.Message);
      }
    }

    [HttpGet("[action]")]
    public async Task<dynamic> GetCurrentPrice(string currencies = "usd,btc")
    {
      try
      {
        string nameCache = string.Format("_CurrentPrice_{0}", currencies.Replace("_", "_"));
        string retornoCache;

        if (!_cache.TryGetValue(nameCache, out retornoCache))
        {
          using (var httpClient = new HttpClient())
          {
            var response = await httpClient.GetAsync(this._config["CoinGeckoApi"] + "/simple/price?ids=smartcash&vs_currencies=" + currencies);

            retornoCache = await response.Content.ReadAsStringAsync();
          }

          _cache.Set(nameCache, retornoCache, new MemoryCacheEntryOptions().SetSlidingExpiration(TimeSpan.FromMinutes(5)));
        }

        return JsonConvert.DeserializeObject<dynamic>(retornoCache);
      }
      catch (Exception ex)
      {
        throw new Exception("Error to get the current price  =>  " + ex.Message);
      }
    }

    [HttpGet("[action]")]
    public async Task<dynamic> GetCurrentList(string coin)
    {
      try
      {
        string nameCache = string.Format("_GetCurrentList_{0}", coin.Replace("_", "_"));
        string retornoCache;

        if (!_cache.TryGetValue(nameCache, out retornoCache))
        {
          using (var httpClient = new HttpClient())
          {
            var response = await httpClient.GetAsync(this._config["CoinGeckoApi"] + "/simple/supported_vs_currencies");
            retornoCache = await response.Content.ReadAsStringAsync();
          }

          _cache.Set(nameCache, retornoCache, new MemoryCacheEntryOptions().SetSlidingExpiration(TimeSpan.FromMinutes(5)));
        }

        return JsonConvert.DeserializeObject<dynamic>(retornoCache);
      }
      catch (Exception ex)
      {
        throw new Exception("Error to get the current price  =>  " + ex.Message);
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> GetPaymentFee([FromBody] dynamic request)
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
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/wallet/paymentfee", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> GetUnpents([FromBody] dynamic request)
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
          var response = await httpClient.PostAsync(this._config["SAPIDomain"] + "/v1/address/unspent/amount", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> SendPayment([FromBody] dynamic request)
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
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/wallet/sendpayment", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> BroadcastTransaction([FromBody] dynamic request)
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
          var response = await httpClient.PostAsync(this._config["SAPIDomain"] + "/v1/transaction/send", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> ImportWallet([FromBody] dynamic request)
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
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/wallet/ImportPrivateKeys", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPut("[action]")]
    public async Task<dynamic> Update([FromBody] dynamic request)
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
          var response = await httpClient.PutAsync(this._config["AppApiDomain"] + "/api/wallet/UpdateAddress", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    private async Task<dynamic> Valid2fa(dynamic requestSend)
    {
      var userKey = (string)JsonConvert.DeserializeObject<dynamic>(requestSend.ToString()).userKey;
      var code = (string)JsonConvert.DeserializeObject<dynamic>(requestSend.ToString()).code;

      using (var httpClient = new HttpClient())
      {
        StringValues auth;
        this.Request.Headers.TryGetValue("Authorization", out auth);
        var authHeader = auth.FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader))
          authHeader = authHeader.Replace("Bearer ", "");
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.FirstOrDefault().Replace("Bearer ", ""));

        var request = new
        {
          userKey = userKey,
          code = code
        };

        using (var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json"))
        {
          content.Headers.Clear();
          content.Headers.Add("Content-Type", "application/json");
          var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/user/2fa/validate", content);
          dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
          return token;
        }
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> Balances([FromBody] dynamic request)
    {
      try
      {
        using (var httpClient = new HttpClient())
        {
          var content = new StringContent(JsonConvert.SerializeObject(request), System.Text.Encoding.UTF8, "application/json");
          var response = await httpClient.PostAsync(this._config["SAPIDomain"] + "/v1/address/balances", content);
          return JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
        }
      }
      catch (Exception ex)
      {
        throw new Exception(ex.Message);
      }
    }

    [HttpGet("[action]/{address}/{pageNumber}")]
    public async Task<dynamic> TXS(string address, string pageNumber)
    {
      try
      {
        using (var httpClient = new HttpClient())
        {
          var response = await httpClient.GetAsync(this._config["ExpApiDomain"] + "/api/txs?address=" + address + "&pageNum=" + pageNumber);
          return JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
        }
      }
      catch (Exception ex)
      {
        throw new Exception(ex.Message);
      }
    }

    [HttpPost("[action]")]
    public async Task<dynamic> CreateLockedAddress([FromBody] dynamic request)
    {
      try
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
            var response = await httpClient.PostAsync(this._config["AppApiDomain"] + "/api/wallet/AddNewSalaryAddress", content);
            dynamic token = JsonConvert.DeserializeObject<dynamic>(await response.Content.ReadAsStringAsync());
            return token;
          }
        }
      }
      catch (Exception ex)
      {
        throw new Exception(ex.Message);
      }
    }
  }
}