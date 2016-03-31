﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Engine;
using Engine.Core.Context;
using Engine.Core.Utils;
using Engine.DataTypes;
using Nancy;

namespace Tweek.ApiService
{
    public class ServingModule : NancyModule
    {
        private static readonly string PREFIX = "/configurations";

        public ServingModule(ITweek tweek) : base(PREFIX)
        {
            Get["{query*}", true] = async (@params, ct) =>
            {
                var requestParams = ((DynamicDictionary) Request.Query).ToDictionary()
                    .ToDictionary(x => x.Key, x => x.Value.ToString());
                HashSet<Identity> identities = new HashSet<Identity>(requestParams.Where(x => !x.Key.Contains(".")).Select(x=>new Identity(x.Key, x.Value)));
                GetLoadedContextByIdentityType contextProps = (identityType) => (key) => (from param in requestParams
                                                                                          let fragments = param.Key.Split('.')
                                                                                          where fragments.Length>1 && fragments[0] == identityType && fragments[1] == key
                                                                                          select param.Value).FirstOrNone();
                string query = @params.query;
                var data = await tweek.Calculate(ConfigurationPath.New(((string)@params.query) ), identities, contextProps);
                return data.ToDictionary(x=>x.Key.ToString(), x=>x.Value.ToString());
            };
            
        }

    }
}