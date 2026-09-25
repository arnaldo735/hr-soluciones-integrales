import { fromEnv } "mo:caffeineai-inference-client/Config";
import ChatApi "mo:caffeineai-inference-client/Apis/ChatApi";
import ChatCompletionRequest "mo:caffeineai-inference-client/Models/ChatCompletionRequest";
import ChatCompletionRequestMessageOneOf2 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf2";
import ResponseFormat "mo:caffeineai-inference-client/Models/ResponseFormat";
import ResponseFormatOneOf1 "mo:caffeineai-inference-client/Models/ResponseFormatOneOf1";
import Runtime "mo:core/Runtime";

module {
  // Una sola llamada de chat contra Caffeine Inference. El modelo es siempre
  // `router`: la plataforma elige el modelo según la complejidad del prompt.
  // `fromEnv<system>()` se lee en cada solicitud porque la plataforma puede
  // rotar las credenciales de un canister en ejecución.
  //
  // `response_format = json_object` obliga al modelo a devolver un objeto JSON
  // en lugar de prosa, lo que hace que el parseo de la extracción sea fiable.
  public func runChat<system>(prompt : Text) : async* Text {
    let config = fromEnv<system>();
    let userMessage = ChatCompletionRequestMessageOneOf2.JSON.init({
      content = #string(prompt);
      role = #user;
    });
    let jsonFormat : ResponseFormat.ResponseFormat = #json_object(
      ResponseFormatOneOf1.init({ type_ = #json_object })
    );
    let req = {
      ChatCompletionRequest.JSON.init({
        messages = [#user(userMessage)];
        model = "router";
      }) with
      response_format = ?jsonFormat;
    };
    let resp = await* ChatApi.createChatCompletion(config, req);
    if (resp.choices.size() == 0) {
      Runtime.trap("Inference returned no choices");
    };
    resp.choices[0].message.content
      ?? Runtime.trap("Inference returned no text content");
  };
};
