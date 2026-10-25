# @coreness/oauth

The OAuth host: the flow, the person's step, and the one door the page's sign-in strip reads. A row's own failure record is read by the MCP picture, not here. Host only: no browser half.

## The flow

`apply` publishes the `oauthFlow` service: `begin`, `finish`, `stores`, `forget`, the stores' helpers (`idOf`, `slugOf`, `keyOf`, `tokenKeyOf`), the reference (`bearerExpression`, `reference`, `noTokenCode`), the callback path and the path one server's callback stands at, the discovery and metadata readers (`discover`, `resourceMetadata`, `serverMetadata`, `pointerOf`), the client registration, the authorization address, the token exchange, the wire's refresh (`refreshTokens`), the PKCE and the refusal vocabulary (`words`, `codes`, `Refusal`). A registration keeps the secret the server answered with; `authMethodFor` names the method the flow registers and signs with.

The credential service is injected and resolved at every call, never held: a composition may replace the credential provider underneath this plugin, and a captured reference then answers "disposed" for every store.

A registration is a client the server answered with, and its secret is part of it: the method the registration asked for is the first this flow can use among the server's `token_endpoint_auth_methods_supported` (the secret in the body, the secret in a Basic header, a public client), and both the exchange and the wire's refresh sign that way. A server that requires client authentication refuses an exchange without it — the person reads its own sentence, because a refusal carries the endpoint's words, the standard's `error_description` or the bare `message` a platform's API answers with.

The person's step (`PersonStep`) is published only where the platform's own two seams stand — the `authorization` registry and the `webServer` carrier — and is withdrawn with them. A composition without them still gets the flow; it simply has no surface to offer and no callback to answer.

## The door

`POST /api/coreness.signin` takes one act per request:

- `sign-ins` — the state of the attempts for the rows the page names.
- `sign-in` — start one attempt for a server; the browser step happens on the platform's own surface.
- `answer` — the value a person typed into a question the flow asked.
- `cancel` — withdraw one attempt.
- `forget` — drop the records the flow committed for one server.

The desk and the flow are one package, so the desk exists with the route: **`no-flow` is not a state this product can be in**, and the code does not exist. A press that finds no `authorization` registry is refused in words as `signin-failed`. The door's own codes are `signin-action`, `signin-body`, `signin-lost`, `signin-failed`.

Answers are `{ ok: true, value: … }` or `{ ok: false, error: { code, message } }`, status 200 in both cases. The grant — the tokens the step commits and the registration the exchange signs with — stands in the platform's credential service until `forget` drops it; a code is forwarded and never kept, and an attempt's state and verifier are taken back when the attempt ends.

The route is registered in the scoped `connection` area with `requestBody: 'buffered'`; `connection` is not declared, and a composition without a web surface logs that the route is not served while the flow stands.

## Checks

The fixtures — `node packages/oauth/scripts/check-flow.mjs` and `check-auth.mjs` — hold the registration's method and the grant's records.
