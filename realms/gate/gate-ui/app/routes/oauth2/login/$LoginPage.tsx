import type { AuthorizeQueryParams } from "@levicape/hall-gate-io/app/qureau/controller/login/AuthorizeQueryParams";
import { client } from "@levicape/hall-gate-io/http/Client";
import {
	ErrorBoundary,
	type FC,
	Suspense,
	use,
	useCallback,
	useId,
	useMemo,
	useRef,
	useState,
} from "hono/jsx";
import { parseQuery } from "ufo";
import { SUSPENSE_GUARD, SuspendPromise } from "../../../ui/ClientSuspense";
import { flattenObject } from "../../../ui/behavior/Object";
import { ErrorFallback, Loader } from "../_design";

const [$rpc, reset] = SuspendPromise(async () => {
	return client(location.origin);
});

const LoginForm: FC<{ query: AuthorizeQueryParams }> = ({ query }) => {
	if (query.error) {
		const url = new URL(window.location.href);
		url.searchParams.delete("error");
		url.searchParams.delete("error_description");
		window.history.pushState(null, "", url.toString());
		throw query.error_description ?? query.error ?? "Unknown error";
	}

	const [promised] = $rpc();
	const $client = use(promised);

	const formRef = useRef<HTMLFormElement>(null);
	const usernameId = useId();
	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordId = useId();
	const passwordRef = useRef<HTMLInputElement>(null);

	const onFormData = useCallback(
		({ formData }: FormDataEvent) => {
			Object.entries(
				flattenObject({
					username: usernameRef.current?.value,
					password: passwordRef.current?.value,
				}),
			).forEach(([key, value]) => {
				if (value === undefined || value === null) {
					return;
				}
				formData.set(key, String(value));
			});
		},
		[usernameRef, passwordRef],
	);

	const url = $client["~"].Hall.Gate.Login.Session.Token.$url().toString();
	const withoutError = { ...query };

	// biome-ignore lint/performance/noDelete:
	delete withoutError.error;
	// biome-ignore lint/performance/noDelete:
	delete withoutError.error_description;

	return (
		<form
			action={`${url}?${new URLSearchParams({
				...withoutError,
			})}`}
			method="post"
			onFormData={onFormData}
			ref={formRef}
		>
			<fieldset className="fieldset">
				<label className="input" for={usernameId}>
					<span className="label">Username</span>
					<input
						required
						ref={usernameRef}
						id={usernameId}
						minlength={6}
						maxlength={64}
						type="text"
					/>
				</label>
				<label className="input" for={passwordId}>
					<span className="label">Password</span>
					<input
						required
						ref={passwordRef}
						id={passwordId}
						minlength={6}
						maxlength={8000}
						type="password"
					/>
				</label>
				<button type="submit" className="btn btn-primary mt-4 btn-wide">
					Login
				</button>
			</fieldset>
		</form>
	);
};

export function LoginPage() {
	const { location } =
		typeof window !== "undefined"
			? window
			: ({} as { location?: { search?: string } });
	const [query] = useMemo(() => {
		const { search } = location ?? {};
		const query = parseQuery(search ?? "") ?? {};
		return [query as AuthorizeQueryParams] as const;
	}, [location?.search]);

	const [_valid, setValid] = useState(Date.now());
	const revalidate = useCallback(() => {
		setValid(Date.now());
		reset?.();
	}, []);

	return (
		<ErrorBoundary
			fallbackRender={(error: unknown) => {
				if (error === SUSPENSE_GUARD) {
					return <Loader />;
				}
				return <ErrorFallback error={error} revalidate={revalidate} />;
			}}
		>
			<Suspense fallback={<Loader />}>
				<LoginForm query={query} />
			</Suspense>
		</ErrorBoundary>
	);
}
