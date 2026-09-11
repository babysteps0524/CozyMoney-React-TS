export function Privacy() {
  return (
    <article className="surface mx-auto max-w-900px p-5 md:p-10">
      <header>
        <h1 className="m-0 text-3xl font-900">개인정보처리방침</h1>

        <p className="mt-4 text-cm-muted leading-7">
          COZYMONEY(이하 "사이트")는 이용자의 개인정보를 중요하게 생각하며, 관련
          법령 및 규정을 준수하기 위해 노력합니다. 본 개인정보처리방침은 사이트
          이용 과정에서 발생할 수 있는 개인정보 및 개인정보와 관련된 정보의
          처리에 관한 사항을 안내하기 위해 작성되었습니다.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="m-0 text-xl font-900">1. 개인정보처리방침의 목적</h2>

        <p className="mt-4 text-cm-muted leading-7">
          COZYMONEY(이하 "사이트")는 이용자의 개인정보를 중요하게 생각하며, 관련
          법령 및 규정을 준수하기 위해 노력합니다. 본 개인정보처리방침은 사이트
          이용 과정에서 발생할 수 있는 개인정보 및 개인정보와 관련된 정보의
          처리에 관한 사항을 안내하기 위해 작성되었습니다.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="m-0 text-xl font-900">2. 수집하는 개인정보</h2>

        <p className="mt-4 text-cm-muted leading-7">
          COZYMONEY는 회원가입 기능을 제공하지 않으며, 이용자가 사이트를
          이용하는 과정에서 직접 개인정보를 입력하도록 요구하지 않습니다.
        </p>

        <p className="mt-4 text-cm-muted leading-7">
          다만 사이트 방문 및 이용 과정에서 웹브라우저 또는 광고·분석 서비스
          등을 통해 접속 정보, 쿠키, IP 주소, 방문 기록 등의 정보가 자동으로
          수집될 수 있습니다.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="m-0 text-xl font-900">3. 쿠키(Cookie)의 사용</h2>

        <p className="mt-4 text-cm-muted leading-7">
          사이트는 이용자의 편의를 제공하고 광고 및 서비스의 운영을 위해 쿠키를
          사용할 수 있습니다.
        </p>

        <p className="mt-4 text-cm-muted leading-7">
          쿠키는 웹사이트를 방문할 때 이용자의 브라우저에 저장되는 작은 텍스트
          파일입니다. 이용자는 웹브라우저의 설정을 통해 쿠키의 저장을 거부하거나
          삭제할 수 있습니다.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="m-0 text-xl font-900">
          4. Google AdSense 및 광고 서비스
        </h2>

        <p className="mt-4 text-cm-muted leading-7">
          COZYMONEY는 Google에서 제공하는 광고 서비스인 Google AdSense를 사용할
          수 있습니다.
        </p>

        <p className="mt-4 text-cm-muted leading-7">
          Google 및 Google의 광고 파트너는 쿠키 또는 유사한 기술을 사용하여
          이용자의 사이트 방문 및 광고와 관련된 정보를 처리할 수 있습니다.
        </p>

        <p className="mt-4 text-cm-muted leading-7">
          이용자는 Google의 광고 설정을 통해 개인 맞춤형 광고에 대한 설정을
          변경할 수 있습니다.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="m-0 text-xl font-900">
          5. Google의 개인정보 및 광고 관련 정책
        </h2>

        <p className="mt-4 text-cm-muted leading-7">
          Google의 개인정보 처리 및 광고와 관련된 자세한 사항은 Google의
          개인정보처리방침 및 광고 설정 페이지에서 확인할 수 있습니다.
        </p>

        <ul className="mt-4 list-disc pl-5 text-cm-muted leading-7">
          <li>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cm-primary hover:underline"
            >
              Google 개인정보처리방침
            </a>
          </li>

          <li className="mt-2">
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cm-primary hover:underline"
            >
              Google 광고 설정
            </a>
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="m-0 text-xl font-900">6. 개인정보처리방침의 변경</h2>

        <p className="mt-4 text-cm-muted leading-7">
          본 개인정보처리방침은 관련 법령, 서비스 내용 또는 사이트 운영 방식의
          변경에 따라 수정될 수 있습니다. 변경사항이 발생하는 경우 본 페이지를
          통해 안내합니다.
        </p>

        <p className="mt-4 text-sm text-cm-muted leading-7">
          개인정보처리방침 시행일: 2026년 8월 13일
        </p>
      </section>

      <footer className="mt-10 border-t border-cm-border pt-6">
        <a href="/" className="font-600 text-cm-primary hover:underline">
          ← CozyMoney 메인으로 돌아가기
        </a>
      </footer>
    </article>
  );
}
